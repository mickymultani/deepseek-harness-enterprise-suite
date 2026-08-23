import { Buffer } from 'node:buffer'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { normalizeBaseUrl, requestJson, resolveCredential } from '../core/http.js'
import { assertResultLimit, renderJson } from '../plugin-kit.js'

export const name = 'enterprise-atlassian'
export const inject = ['tools', 'credentials']

export const Config = Schema.object({
  mode: Schema.union(['mock', 'live']).default('mock'),
  baseUrl: Schema.string().default('https://example.atlassian.net'),
  authMode: Schema.union(['basic', 'bearer']).default('basic'),
  tokenRef: Schema.string().default('ATLASSIAN_API_TOKEN'),
  emailRef: Schema.string().default('ATLASSIAN_EMAIL'),
  requestTimeoutMs: Schema.number().default(30_000),
  maxResponseBytes: Schema.number().default(2_000_000),
  allowInsecureHttp: Schema.boolean().default(false),
})

const issueSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', required: true },
    url: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    description: { type: 'string', required: true },
    status: { type: 'string', required: true },
    issueType: { type: 'string', required: true },
    priority: { type: 'string', required: true },
    labels: { type: 'array', items: { type: 'string' }, required: true },
  },
}

const findingSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    severity: { type: 'string', enum: ['info', 'warning', 'error'], required: true },
    code: { type: 'string', required: true },
    message: { type: 'string', required: true },
  },
}

function adfText(value) {
  if (typeof value === 'string') return value
  if (value === null || typeof value !== 'object') return ''
  const text = []
  const pending = [value]
  while (pending.length > 0) {
    const node = pending.pop()
    if (node === null || typeof node !== 'object') continue
    if (typeof node.text === 'string') text.push(node.text)
    if (Array.isArray(node.content)) pending.push(...node.content.toReversed())
  }
  return text.join('\n')
}

function descriptionDocument(text) {
  return {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }
}

function normalizeIssue(baseUrl, raw) {
  const fields = raw.fields ?? raw
  const key = String(raw.key ?? fields.key ?? '')
  return {
    key,
    url: new URL(`/browse/${encodeURIComponent(key)}`, baseUrl).toString(),
    summary: String(fields.summary ?? ''),
    description: adfText(fields.description),
    status: String(fields.status?.name ?? fields.status ?? 'Unknown'),
    issueType: String(fields.issuetype?.name ?? fields.issueType ?? 'Task'),
    priority: String(fields.priority?.name ?? fields.priority ?? 'Unspecified'),
    labels: Array.isArray(fields.labels) ? fields.labels.map(String) : [],
  }
}

function reviewIssue(issue) {
  const findings = []
  if (issue.summary.trim().length < 12) {
    findings.push({ severity: 'warning', code: 'SUMMARY_TOO_SHORT', message: 'Summary should describe the outcome or problem more precisely.' })
  }
  if (issue.description.trim().length < 40) {
    findings.push({ severity: 'error', code: 'DESCRIPTION_INCOMPLETE', message: 'Description needs enough context for an independent reviewer.' })
  }
  if (!/acceptance criteria|definition of done|given.+when.+then/is.test(issue.description)) {
    findings.push({ severity: 'error', code: 'ACCEPTANCE_CRITERIA_MISSING', message: 'Add testable acceptance criteria or a definition of done.' })
  }
  if (issue.priority === 'Unspecified') {
    findings.push({ severity: 'warning', code: 'PRIORITY_MISSING', message: 'Assign a priority before the issue enters delivery.' })
  }
  if (issue.key.startsWith('SEC-') && !/risk|threat|control|cve|vulnerab/i.test(issue.description)) {
    findings.push({ severity: 'error', code: 'SECURITY_RISK_MISSING', message: 'Security issues must identify the risk, threat, vulnerability, or control.' })
  }
  return {
    issue,
    passed: !findings.some(finding => finding.severity === 'error'),
    findings,
  }
}

function createMockStore(baseUrl) {
  const issues = new Map([
    ['ENG-42', {
      key: 'ENG-42',
      url: new URL('/browse/ENG-42', baseUrl).toString(),
      summary: 'Add SSO enforcement to the admin console',
      description: 'Require SAML SSO for administrators. Acceptance criteria: local passwords are rejected and the break-glass account is audited.',
      status: 'In Progress',
      issueType: 'Story',
      priority: 'High',
      labels: ['identity', 'enterprise'],
    }],
    ['SEC-101', {
      key: 'SEC-101',
      url: new URL('/browse/SEC-101', baseUrl).toString(),
      summary: 'Rotate the gateway signing key',
      description: 'Risk: the signing key is near its rotation deadline. Acceptance criteria: rotate it, verify both key ids, and retain rollback evidence.',
      status: 'Open',
      issueType: 'Security',
      priority: 'Critical',
      labels: ['key-management'],
    }],
  ])
  const pages = [
    { id: '1001', spaceKey: 'ENG', title: 'Production deployment runbook', excerpt: 'Deployment gates, rollback steps, owners, and evidence requirements.', url: new URL('/wiki/spaces/ENG/pages/1001', baseUrl).toString() },
    { id: '1002', spaceKey: 'SEC', title: 'Generative AI acceptable use policy', excerpt: 'Data classification, approved gateways, prohibited secrets, and human review.', url: new URL('/wiki/spaces/SEC/pages/1002', baseUrl).toString() },
    { id: '1003', spaceKey: 'SEC', title: 'Incident response handbook', excerpt: 'Severity definitions, escalation paths, containment, and notification duties.', url: new URL('/wiki/spaces/SEC/pages/1003', baseUrl).toString() },
  ]
  let next = 200
  return {
    search(query, spaceKey, limit) {
      const needle = query.toLowerCase()
      return pages.filter(page => (!spaceKey || page.spaceKey === spaceKey)
        && `${page.title} ${page.excerpt}`.toLowerCase().includes(needle)).slice(0, limit)
    },
    getIssue(key) {
      const issue = issues.get(key)
      if (!issue) throw new Error(`Jira issue ${key} was not found`)
      return structuredClone(issue)
    },
    createIssue(args) {
      next += 1
      const key = `${args.projectKey}-${next}`
      const issue = {
        key,
        url: new URL(`/browse/${key}`, baseUrl).toString(),
        summary: args.summary,
        description: args.description,
        status: 'Open',
        issueType: args.issueType ?? 'Task',
        priority: args.priority ?? 'Unspecified',
        labels: args.labels ?? [],
      }
      issues.set(key, issue)
      return structuredClone(issue)
    },
  }
}

function escapeCql(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function createLiveClient(ctx, config, baseUrl, tokenRef, emailRef) {
  async function authorization() {
    const token = await resolveCredential(ctx, tokenRef, config.tokenRef)
    if (config.authMode === 'bearer') return `Bearer ${token}`
    const email = await resolveCredential(ctx, emailRef, config.emailRef)
    return `Basic ${Buffer.from(`${email}:${token}`, 'utf8').toString('base64')}`
  }

  async function request(path, init, signal) {
    return requestJson({
      baseUrl,
      path,
      method: init?.method,
      body: init?.body,
      headers: { Authorization: await authorization(), ...init?.headers },
      signal,
      timeoutMs: config.requestTimeoutMs,
      maxResponseBytes: config.maxResponseBytes,
    })
  }

  return {
    async search(query, spaceKey, limit, signal) {
      const cql = [`text ~ "${escapeCql(query)}"`]
      if (spaceKey) cql.push(`space = "${escapeCql(spaceKey)}"`)
      const params = new URLSearchParams({ cql: cql.join(' AND '), limit: String(limit), expand: 'space,body.view' })
      const data = await request(`/wiki/rest/api/content/search?${params}`, undefined, signal)
      return (data.results ?? []).map(page => ({
        id: String(page.id),
        spaceKey: String(page.space?.key ?? spaceKey ?? ''),
        title: String(page.title ?? ''),
        excerpt: adfText(page.body?.view?.value ?? ''),
        url: new URL(page._links?.webui ?? `/wiki/pages/${page.id}`, baseUrl).toString(),
      }))
    },
    async getIssue(key, signal) {
      const fields = 'summary,description,status,issuetype,priority,labels'
      const data = await request(`/rest/api/3/issue/${encodeURIComponent(key)}?fields=${fields}`, undefined, signal)
      return normalizeIssue(baseUrl, data)
    },
    async createIssue(args, signal) {
      const fields = {
        project: { key: args.projectKey },
        summary: args.summary,
        description: descriptionDocument(args.description),
        issuetype: { name: args.issueType ?? 'Task' },
        ...args.priority ? { priority: { name: args.priority } } : {},
        ...args.labels ? { labels: args.labels } : {},
      }
      const created = await request('/rest/api/3/issue', { method: 'POST', body: { fields } }, signal)
      return this.getIssue(String(created.key), signal)
    },
  }
}

export function apply(ctx, config) {
  const baseUrl = normalizeBaseUrl(config.baseUrl, { allowInsecureHttp: config.allowInsecureHttp })
  if (!Number.isFinite(config.requestTimeoutMs) || config.requestTimeoutMs <= 0) {
    throw new TypeError('enterprise-atlassian: requestTimeoutMs must be positive')
  }
  if (!Number.isInteger(config.maxResponseBytes) || config.maxResponseBytes < 1) {
    throw new TypeError('enterprise-atlassian: maxResponseBytes must be a positive integer')
  }
  const tokenRef = credentialRef(config.tokenRef)
  const emailRef = credentialRef(config.emailRef)
  const client = config.mode === 'mock'
    ? createMockStore(baseUrl)
    : createLiveClient(ctx, config, baseUrl, tokenRef, emailRef)

  ctx.tools.register(defineTool({
    name: 'confluence_search',
    description: 'Search enterprise Confluence pages. Use the narrowest relevant space when known.',
    parameters: {
      query: { type: 'string', required: true, description: 'Words or phrase to find.' },
      spaceKey: { type: 'string', description: 'Optional Confluence space key.' },
      limit: { type: 'integer', description: 'Result count from 1 through 50; defaults to 10.' },
    },
    output: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true },
            spaceKey: { type: 'string', required: true },
            title: { type: 'string', required: true },
            excerpt: { type: 'string', required: true },
            url: { type: 'string', required: true },
          },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      return client.search(args.query, args.spaceKey, assertResultLimit(args.limit), exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'jira_issue_get',
    description: 'Read one Jira issue with the fields needed for enterprise review.',
    parameters: { issueKey: { type: 'string', required: true, description: 'Jira issue key such as SEC-101.' } },
    output: { schema: issueSchema, render: (_args, value) => renderJson(value) },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      return client.getIssue(args.issueKey, exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'jira_issue_create',
    description: 'Create a Jira issue. Enterprise policy may require human approval before dispatch.',
    parameters: {
      projectKey: { type: 'string', required: true, description: 'Destination Jira project key.' },
      summary: { type: 'string', required: true },
      description: { type: 'string', required: true },
      issueType: { type: 'string', description: 'Defaults to Task.' },
      priority: { type: 'string' },
      labels: { type: 'array', items: { type: 'string' } },
    },
    output: {
      schema: issueSchema,
      render: (_args, value) => [{ type: 'text', text: `Created ${value.key}: ${value.summary}\n${value.url}` }],
    },
    async execute(args, exec) {
      if (args.summary.trim().length === 0 || args.description.trim().length === 0) {
        throw new TypeError('summary and description must not be blank')
      }
      return client.createIssue(args, exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'jira_issue_review',
    description: 'Review a Jira issue against baseline enterprise completeness and security-ticket rules.',
    parameters: { issueKey: { type: 'string', required: true, description: 'Jira issue key such as SEC-101.' } },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          issue: { ...issueSchema, required: true },
          passed: { type: 'boolean', required: true },
          findings: { type: 'array', items: findingSchema, required: true },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      return reviewIssue(await client.getIssue(args.issueKey, exec.signal))
    },
  }))
}
