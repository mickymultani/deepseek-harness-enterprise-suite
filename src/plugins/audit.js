import { appendFileSync, chmodSync, mkdirSync } from 'node:fs'
import { dirname, isAbsolute } from 'node:path'
import { performance } from 'node:perf_hooks'
import Schema from '@deepseek-ai/schemastery'
import { compilePatterns, DEFAULT_SENSITIVE_PATTERNS, redactJson } from '../core/redaction.js'

export const name = 'enterprise-audit'
export const inject = ['tools']

export const Config = Schema.object({
  path: Schema.string().required(),
  includeArguments: Schema.boolean().default(false),
  sensitivePatterns: Schema.array(Schema.string()).default(DEFAULT_SENSITIVE_PATTERNS),
})

export function apply(ctx, config) {
  if (!isAbsolute(config.path)) throw new TypeError('enterprise-audit: path must be absolute')
  const patterns = compilePatterns(config.sensitivePatterns, 'audit.sensitivePatterns')
  mkdirSync(dirname(config.path), { recursive: true, mode: 0o700 })
  const durations = new Map()

  ctx.on('tools/execute', async (exec, next) => {
    const started = performance.now()
    try {
      return await next()
    } finally {
      durations.set(exec.token, Math.round((performance.now() - started) * 100) / 100)
    }
  })

  ctx.on('tools/result', (exec, result) => {
    const record = {
      schemaVersion: 1,
      timestamp: new Date().toISOString(),
      sessionId: exec.agent?.session?.id ? String(exec.agent.session.id) : null,
      callId: String(exec.callId),
      rootCallId: String(exec.rootCallId),
      tool: exec.name,
      outcome: result.isError ? 'error' : 'success',
      durationMs: durations.get(exec.token) ?? null,
      ...result.isError ? { error: result.error.message } : {},
      ...config.includeArguments ? { arguments: redactJson(exec.arguments, { patterns }) } : {},
    }
    durations.delete(exec.token)
    appendFileSync(config.path, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 })
    chmodSync(config.path, 0o600)
  })
}
