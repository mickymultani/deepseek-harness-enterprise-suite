export { defineTool } from '@deepseek-ai/dsh-tools'
export { assertPositiveNumber, normalizeBaseUrl, requestJson, resolveCredential } from './core/http.js'
export { compilePatterns, containsSensitiveValue, DEFAULT_SENSITIVE_PATTERNS, redactJson } from './core/redaction.js'

export function assertResultLimit(limit, options = {}) {
  const minimum = options.minimum ?? 1
  const maximum = options.maximum ?? 50
  const fallback = options.fallback ?? 10
  const resolved = limit ?? fallback
  if (!Number.isInteger(resolved) || resolved < minimum || resolved > maximum) {
    throw new TypeError(`limit must be an integer from ${minimum} through ${maximum}`)
  }
  return resolved
}

export function renderJson(value) {
  return [{ type: 'text', text: JSON.stringify(value, null, 2) }]
}
