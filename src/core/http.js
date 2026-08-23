const DEFAULT_MAX_RESPONSE_BYTES = 2_000_000

export function normalizeBaseUrl(raw, options = {}) {
  const url = new URL(raw)
  if (!options.allowInsecureHttp && url.protocol !== 'https:') {
    throw new TypeError('base URL must use HTTPS unless allowInsecureHttp is explicitly enabled')
  }
  if (url.username || url.password) throw new TypeError('base URL must not contain credentials')
  url.pathname = url.pathname.replace(/\/$/, '')
  url.search = ''
  url.hash = ''
  return url
}

export function assertPositiveNumber(value, field) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${field} must be positive`)
  return value
}

export async function resolveCredential(ctx, reference, label = String(reference)) {
  const resolved = await ctx.credentials.resolve(reference)
  if (!resolved) throw new Error(`credential reference ${label} is not configured`)
  return resolved.value
}

export async function requestJson(options) {
  const timeoutMs = assertPositiveNumber(options.timeoutMs, 'timeoutMs')
  const maxResponseBytes = assertPositiveNumber(
    options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
    'maxResponseBytes',
  )
  const url = new URL(options.path, options.baseUrl)
  const response = await (options.fetchImpl ?? fetch)(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...options.body !== undefined ? { 'Content-Type': 'application/json' } : {},
      ...options.headers,
    },
    ...options.body !== undefined ? { body: JSON.stringify(options.body) } : {},
    signal: AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]),
  })
  if (!response.ok) {
    throw new Error(`request ${options.method ?? 'GET'} ${url.pathname} failed with HTTP ${response.status}`)
  }
  const bytes = await response.arrayBuffer()
  if (bytes.byteLength > maxResponseBytes) {
    throw new Error(`response from ${url.pathname} exceeded ${maxResponseBytes} bytes`)
  }
  if (bytes.byteLength === 0) return null
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error(`response from ${url.pathname} was not valid JSON`)
  }
}
