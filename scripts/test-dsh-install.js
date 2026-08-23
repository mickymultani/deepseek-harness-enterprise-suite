import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const harness = resolve(process.env.DSH_HARNESS_DIR ?? join(root, '..', 'deepseek-harness'))
const harnessPackage = JSON.parse(await readFile(join(harness, 'package.json'), 'utf8'))
if (harnessPackage.name !== '@deepseek-ai/dsh-root') throw new Error(`not a DeepSeek Harness checkout: ${harness}`)

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'dsh-enterprise-install-'))
const home = join(temporaryDirectory, 'home')
const archive = join(temporaryDirectory, 'dsh-enterprise-suite.tgz')

function run(cwd, args, env = process.env) {
  const result = spawnSync('pnpm', args, {
    cwd,
    env,
    encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`)
  return result.stdout
}

try {
  run(root, ['pack', '--out', archive])
  const harnessEnvironment = { ...process.env, DSH_HOME: home }
  run(harness, ['dsh', 'plugin', '--profile', 'web', 'add', archive], harnessEnvironment)
  const config = run(harness, ['dsh', '--profile', 'web', '--dump-config'], harnessEnvironment)
  for (const id of ['enterprise-atlassian', 'enterprise-policy', 'enterprise-audit']) {
    if (!config.includes(`id: ${id}`)) throw new Error(`installed profile is missing ${id}`)
  }
  console.log(`DeepSeek Harness ${harnessPackage.version}: release tarball installation passed.`)
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
