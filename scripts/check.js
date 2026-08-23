import { access, readFile, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ignored = new Set(['.git', 'node_modules'])
const localPathPatterns = [new RegExp(`/${'Users'}/`), new RegExp(`C:\\\\${'Users'}\\\\`)]

async function filesBelow(directory) {
  const files = []
  const pending = [directory]
  while (pending.length > 0) {
    const current = pending.pop()
    if (current !== root) {
      try {
        await access(join(current, '.git'))
        continue
      } catch {
        // Continue walking ordinary project directories.
      }
    }
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue
      const path = join(current, entry.name)
      if (entry.isDirectory()) pending.push(path)
      else files.push(path)
    }
  }
  return files
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

const files = await filesBelow(root)
for (const file of files.filter(file => extname(file) === '.js')) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (result.status !== 0) fail(`${relative(root, file)}: ${result.stderr.trim()}`)
}

for (const file of files.filter(file => ['.js', '.json', '.md', '.yml', '.yaml'].includes(extname(file)))) {
  const text = await readFile(file, 'utf8')
  if (!text.endsWith('\n')) fail(`${relative(root, file)}: missing final newline`)
  if (/[ \t]+$/m.test(text)) fail(`${relative(root, file)}: trailing whitespace`)
  if (localPathPatterns.some(pattern => pattern.test(text))) fail(`${relative(root, file)}: contains a local absolute path`)
}

const catalog = JSON.parse(await readFile(join(root, 'catalog/enterprise-plugins.json'), 'utf8'))
const ids = new Set()
const statuses = new Set(['available', 'foundation', 'planned'])
const risks = new Set(['read', 'propose', 'write', 'control-plane'])
for (const entry of catalog) {
  if (!/^[a-z][a-z0-9-]+$/.test(entry.id)) fail(`catalog: invalid id ${entry.id}`)
  if (ids.has(entry.id)) fail(`catalog: duplicate id ${entry.id}`)
  ids.add(entry.id)
  if (!statuses.has(entry.status)) fail(`catalog: invalid status for ${entry.id}`)
  if (!risks.has(entry.risk)) fail(`catalog: invalid risk for ${entry.id}`)
  if (typeof entry.description !== 'string' || entry.description.length < 10) fail(`catalog: incomplete description for ${entry.id}`)
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
for (const path of packageJson.files) {
  try {
    await access(join(root, path))
  } catch {
    fail(`package files entry does not exist: ${path}`)
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`Checked ${files.length} files and ${catalog.length} catalog entries.`)
