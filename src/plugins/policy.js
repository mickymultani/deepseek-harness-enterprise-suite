import Schema from '@deepseek-ai/schemastery'
import { compilePatterns, containsSensitiveValue, DEFAULT_SENSITIVE_PATTERNS } from '../core/redaction.js'

export const name = 'enterprise-policy'
export const inject = ['tools']

export const Config = Schema.object({
  mode: Schema.union(['audit', 'enforce']).default('enforce'),
  allowedJiraProjects: Schema.array(Schema.string()).default([]),
  allowedConfluenceSpaces: Schema.array(Schema.string()).default([]),
  protectedToolPrefixes: Schema.array(Schema.string()).default(['jira_', 'confluence_']),
  sensitivePatterns: Schema.array(Schema.string()).default(DEFAULT_SENSITIVE_PATTERNS),
  requireApprovalForWrites: Schema.boolean().default(true),
})

function projectFromExecution(exec) {
  const args = exec.arguments
  if (typeof args?.projectKey === 'string') return args.projectKey
  if (typeof args?.issueKey === 'string') return args.issueKey.split('-', 1)[0]
  return undefined
}

export function compilePolicy(config) {
  const patterns = compilePatterns(config.sensitivePatterns)
  const projects = new Set(config.allowedJiraProjects)
  const spaces = new Set(config.allowedConfluenceSpaces)

  return function violation(exec) {
    if (!config.protectedToolPrefixes.some(prefix => exec.name.startsWith(prefix))) return undefined
    if (containsSensitiveValue(JSON.stringify(exec.arguments), patterns)) {
      return 'Denied by enterprise DLP policy: the request appears to contain a credential, private key, or regulated identifier.'
    }
    const project = projectFromExecution(exec)
    if (project && projects.size > 0 && !projects.has(project)) {
      return `Denied by enterprise Jira policy: project ${project} is not in the configured allowlist.`
    }
    const space = typeof exec.arguments?.spaceKey === 'string' ? exec.arguments.spaceKey : undefined
    if (space && spaces.size > 0 && !spaces.has(space)) {
      return `Denied by enterprise Confluence policy: space ${space} is not in the configured allowlist.`
    }
    return undefined
  }
}

export function apply(ctx, config) {
  const violation = compilePolicy(config)
  ctx.tools.guard(exec => {
    const reason = violation(exec)
    if (!reason) return undefined
    if (config.mode === 'audit') {
      ctx.logger.warn(`enterprise-policy audit: ${reason}`)
      return undefined
    }
    return reason
  })
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (config.mode === 'enforce' && config.requireApprovalForWrites && exec.name === 'jira_issue_create') {
      return { kind: 'ask', reason: 'Enterprise policy requires one-time human approval before creating a Jira issue.' }
    }
    return next()
  })
}
