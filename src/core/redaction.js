export const DEFAULT_SENSITIVE_PATTERNS = [
  'AKIA[0-9A-Z]{16}',
  '(?:api[_-]?key|token|password)\\s*[:=]\\s*[^\\s,;]{8,}',
  '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
  '\\b\\d{3}-\\d{2}-\\d{4}\\b',
]

const SENSITIVE_KEY = /authorization|cookie|credential|password|secret|token|api[_-]?key/i

export function compilePatterns(sources, label = 'sensitivePatterns') {
  return sources.map((source, index) => {
    try {
      return new RegExp(source, 'i')
    } catch (error) {
      throw new TypeError(`${label}[${index}] is invalid: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}

export function containsSensitiveValue(value, patterns) {
  return patterns.some(pattern => pattern.test(value))
}

export function redactJson(value, options = {}, seen = new Set()) {
  const patterns = options.patterns ?? compilePatterns(DEFAULT_SENSITIVE_PATTERNS)
  if (typeof value === 'string') return containsSensitiveValue(value, patterns) ? '[REDACTED]' : value
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[CIRCULAR]'
  seen.add(value)
  if (Array.isArray(value)) return value.map(item => redactJson(item, { patterns }, seen))
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactJson(entry, { patterns }, seen),
  ]))
}
