import Schema from '@deepseek-ai/schemastery'
import { defineTool, renderJson } from 'dsh-enterprise-suite/plugin-kit'

export const name = '{{slug}}'
export const inject = ['tools']

export const Config = Schema.object({
  mode: Schema.union(['mock', 'live']).default('mock'),
  requestTimeoutMs: Schema.number().default(30_000),
})

export function apply(ctx, config) {
  if (!Number.isFinite(config.requestTimeoutMs) || config.requestTimeoutMs <= 0) {
    throw new TypeError('{{slug}}: requestTimeoutMs must be positive')
  }
  ctx.tools.register(defineTool({
    name: '{{toolName}}_lookup',
    description: 'Look up one {{title}} resource. Replace the mock implementation before enabling live mode.',
    parameters: {
      id: { type: 'string', required: true, description: 'Resource identifier.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          source: { type: 'string', required: true },
        },
      },
      render: (_args, value) => renderJson(value),
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      if (exec.signal.aborted) throw exec.signal.reason
      if (config.mode === 'live') throw new Error('{{slug}}: implement and test the live provider before enabling it')
      return { id: args.id, name: `Mock resource ${args.id}`, source: '{{slug}}-mock' }
    },
  }))
}
