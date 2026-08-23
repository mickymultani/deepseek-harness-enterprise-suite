#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function usage() {
  return `Usage: create-dsh-enterprise-plugin <name> [--kind connector|policy] [--out <path>]

Creates a standalone DeepSeek Harness enterprise plugin project without overwriting an existing path.`
}

function parseArgs(argv) {
  const options = { kind: 'connector' }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--help' || value === '-h') return { help: true }
    if (value === '--kind') options.kind = argv[++index]
    else if (value === '--out') options.out = argv[++index]
    else if (!options.name) options.name = value
    else throw new Error(`unexpected argument: ${value}`)
  }
  if (!options.name) throw new Error('plugin name is required')
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(options.name)) {
    throw new Error('plugin name must be 2-64 lowercase letters, digits, or hyphens and start with a letter')
  }
  if (!['connector', 'policy'].includes(options.kind)) throw new Error('--kind must be connector or policy')
  return options
}

async function materialize(sourceRoot, destination, replacements) {
  await mkdir(destination, { recursive: false })
  const pending = ['.']
  while (pending.length > 0) {
    const relative = pending.pop()
    const source = resolve(sourceRoot, relative)
    for (const entry of await readdir(source, { withFileTypes: true })) {
      const inputRelative = join(relative, entry.name)
      const outputRelative = inputRelative.replace(/\.tpl$/, '')
      const outputPath = resolve(destination, outputRelative)
      if (entry.isDirectory()) {
        await mkdir(outputPath)
        pending.push(inputRelative)
        continue
      }
      let text = await readFile(resolve(sourceRoot, inputRelative), 'utf8')
      for (const [key, value] of Object.entries(replacements)) text = text.replaceAll(`{{${key}}}`, value)
      await writeFile(outputPath, text, 'utf8')
    }
  }
}

export async function createPlugin(options) {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const sourceRoot = resolve(scriptDirectory, '..', 'templates', `${options.kind}-plugin`)
  const destination = resolve(options.out ?? join(process.cwd(), options.name))
  const toolName = options.name.replaceAll('-', '_')
  await materialize(sourceRoot, destination, {
    slug: options.name,
    toolName,
    title: options.name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' '),
  })
  return destination
}

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  try {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) {
      console.log(usage())
      process.exitCode = 0
    } else {
      const destination = await createPlugin(options)
      console.log(`Created ${options.kind} plugin at ${destination}`)
      console.log('Next: review README.md, run pnpm install, then pnpm test.')
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error(usage())
    process.exitCode = 1
  }
}
