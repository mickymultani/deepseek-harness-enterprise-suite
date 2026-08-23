import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBaseUrl, requestJson } from '../src/core/http.js'
import { compilePatterns, DEFAULT_SENSITIVE_PATTERNS, redactJson } from '../src/core/redaction.js'

test('normalizes secure base URLs and rejects embedded credentials', () => {
  assert.equal(normalizeBaseUrl('https://example.com/root/').toString(), 'https://example.com/root')
  assert.throws(() => normalizeBaseUrl('http://example.com'), /HTTPS/)
  assert.throws(() => normalizeBaseUrl('https://user:secret@example.com'), /credentials/)
})

test('bounds and parses JSON responses without exposing response bodies in errors', async () => {
  const signal = new AbortController().signal
  const value = await requestJson({
    baseUrl: new URL('https://example.com'), path: '/ok', signal, timeoutMs: 1_000,
    fetchImpl: async () => new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
  })
  assert.deepEqual(value, { ok: true })
  await assert.rejects(() => requestJson({
    baseUrl: new URL('https://example.com'), path: '/bad', signal, timeoutMs: 1_000,
    fetchImpl: async () => new Response('token=must-not-appear', { status: 500 }),
  }), error => !error.message.includes('must-not-appear') && /HTTP 500/.test(error.message))
})

test('redacts sensitive keys and values recursively', () => {
  const patterns = compilePatterns(DEFAULT_SENSITIVE_PATTERNS)
  assert.deepEqual(redactJson({ token: 'secret', nested: { value: '123-45-6789' } }, { patterns }), {
    token: '[REDACTED]', nested: { value: '[REDACTED]' },
  })
})
