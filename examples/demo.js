import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import CredentialsLocal from '@deepseek-ai/dsh-credentials-local'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as atlassian from '../src/plugins/atlassian.js'
import * as audit from '../src/plugins/audit.js'
import * as policy from '../src/plugins/policy.js'

const root = mkdtempSync(join(tmpdir(), 'dsh-enterprise-demo-'))
const auditPath = join(root, 'enterprise-audit.jsonl')
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
  }),
  await ctx.plugin(audit, { path: auditPath, includeArguments: true }),
]

let sequence = 0
async function call(name, arguments_) {
  sequence += 1
  return ctx.tools.execute({
    signal: new AbortController().signal,
    callId: CallId(`demo-${sequence}`),
    name,
    arguments: arguments_,
  })
}

const search = await call('confluence_search', { query: 'generative AI', spaceKey: 'SEC' })
const review = await call('jira_issue_review', { issueKey: 'SEC-101' })
const created = await call('jira_issue_create', {
  projectKey: 'ENG',
  summary: 'Document the enterprise AI gateway rollout',
  description: 'Publish the rollout and rollback plan. Acceptance criteria: owners, controls, evidence, and escalation paths are documented.',
  issueType: 'Task',
  priority: 'High',
  labels: ['genai', 'governance'],
})
const deniedProject = await call('jira_issue_get', { issueKey: 'FIN-7' })
const deniedSecret = await call('confluence_search', { query: 'token=super-secret-value-that-must-not-leave', spaceKey: 'SEC' })
const records = readFileSync(auditPath, 'utf8').trim().split('\n').map(line => JSON.parse(line))

console.log(JSON.stringify({
  tools: ctx.tools.schemas().map(schema => schema.name),
  confluenceTitle: search.isError ? null : search.value[0]?.title,
  jiraReviewPassed: review.isError ? null : review.value.passed,
  createdIssue: created.isError ? null : created.value.key,
  deniedProject: deniedProject.isError,
  deniedSecret: deniedSecret.isError,
  secretRedactedInAudit: records.at(-1)?.arguments?.query === '[REDACTED]',
  auditRecords: records.length,
}, null, 2))

for (const fiber of fibers.toReversed()) await fiber.dispose()
