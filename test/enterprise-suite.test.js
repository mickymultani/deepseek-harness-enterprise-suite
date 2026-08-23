import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import CredentialsLocal from '@deepseek-ai/dsh-credentials-local'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as atlassian from '../src/plugins/atlassian.js'
import * as audit from '../src/plugins/audit.js'
import * as policy from '../src/plugins/policy.js'

async function boot(options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-enterprise-test-'))
  const auditPath = join(root, 'audit.jsonl')
  const ctx = new Context()
  const fibers = [
    await ctx.plugin(SystemPrompt),
    await ctx.plugin(ToolRuntime),
    await ctx.plugin(CredentialsLocal, { dshHome: root, watch: false }),
    await ctx.plugin(atlassian, { mode: 'mock' }),
    await ctx.plugin(policy, {
      mode: 'enforce',
      allowedJiraProjects: ['ENG', 'SEC'],
      allowedConfluenceSpaces: ['ENG', 'SEC'],
      requireApprovalForWrites: false,
      ...options.policy,
    }),
    await ctx.plugin(audit, { path: auditPath, includeArguments: true }),
  ]
  let sequence = 0
  return {
    ctx,
    auditPath,
    async call(name, arguments_) {
      sequence += 1
      return ctx.tools.execute({ signal: new AbortController().signal, callId: CallId(`test-${sequence}`), name, arguments: arguments_ })
    },
    async dispose() {
      for (const fiber of fibers.toReversed()) await fiber.dispose()
    },
  }
}

test('registers all enterprise tools and searches mock Confluence', async () => {
  const app = await boot()
  try {
    assert.deepEqual(app.ctx.tools.schemas().map(schema => schema.name), [
      'confluence_search', 'jira_issue_get', 'jira_issue_create', 'jira_issue_review',
    ])
    const result = await app.call('confluence_search', { query: 'acceptable use', spaceKey: 'SEC' })
    assert.equal(result.isError, false)
    assert.equal(result.value[0].title, 'Generative AI acceptable use policy')
  } finally {
    await app.dispose()
  }
})

test('reviews and creates Jira issues through canonical values', async () => {
  const app = await boot()
  try {
    const review = await app.call('jira_issue_review', { issueKey: 'SEC-101' })
    assert.equal(review.isError, false)
    assert.equal(review.value.passed, true)
    const created = await app.call('jira_issue_create', {
      projectKey: 'ENG',
      summary: 'Create the enterprise gateway operating guide',
      description: 'Document the approved gateway. Acceptance criteria: owners, monitoring, rollback, and support paths are complete.',
      priority: 'High',
    })
    assert.equal(created.isError, false)
    assert.match(created.value.key, /^ENG-/)
  } finally {
    await app.dispose()
  }
})

test('denies disallowed projects and redacts secret-bearing requests', async () => {
  const app = await boot()
  try {
    const project = await app.call('jira_issue_get', { issueKey: 'FIN-1' })
    assert.equal(project.isError, true)
    const secret = 'token=super-secret-value-that-must-not-leave'
    const dlp = await app.call('confluence_search', { query: secret, spaceKey: 'SEC' })
    assert.equal(dlp.isError, true)
    const records = readFileSync(app.auditPath, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    assert.equal(records[1].arguments.query, '[REDACTED]')
    assert.equal(JSON.stringify(records).includes(secret), false)
  } finally {
    await app.dispose()
  }
})

test('fails closed when approval is required but unavailable', async () => {
  const app = await boot({ policy: { requireApprovalForWrites: true } })
  try {
    const result = await app.call('jira_issue_create', {
      projectKey: 'ENG',
      summary: 'This write requires an approval answerer',
      description: 'Acceptance criteria: an unavailable approval path fails closed.',
    })
    assert.equal(result.isError, true)
    assert.match(result.error.message, /approval/i)
  } finally {
    await app.dispose()
  }
})
