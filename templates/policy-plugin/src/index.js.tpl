import Schema from '@deepseek-ai/schemastery'

export const name = '{{slug}}'
export const inject = ['tools']

export const Config = Schema.object({
  mode: Schema.union(['audit', 'enforce']).default('enforce'),
  deniedTools: Schema.array(Schema.string()).default([]),
})

export function apply(ctx, config) {
  const denied = new Set(config.deniedTools)
  ctx.tools.guard(exec => {
    if (!denied.has(exec.name)) return undefined
    const reason = `Denied by {{title}} policy: tool ${exec.name} is prohibited.`
    if (config.mode === 'audit') {
      ctx.logger.warn(reason)
      return undefined
    }
    return reason
  })
}
