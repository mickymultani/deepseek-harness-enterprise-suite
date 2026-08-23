import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as plugin from '../src/index.js'

test('registers and executes the mock connector', async () => {
  const ctx = new Context()
  const systemPrompt = await ctx.plugin(SystemPrompt)
  const tools = await ctx.plugin(ToolRuntime)
  const subject = await ctx.plugin(plugin, { mode: 'mock' })
  try {
    const result = await ctx.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('test-1'),
      name: '{{toolName}}_lookup',
      arguments: { id: 'example' },
    })
    assert.equal(result.isError, false)
    assert.equal(result.value.id, 'example')
  } finally {
    await subject.dispose()
    await tools.dispose()
    await systemPrompt.dispose()
  }
})
