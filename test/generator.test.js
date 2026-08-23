import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createPlugin } from '../bin/create-plugin.js'

test('generates connector and policy projects without unresolved placeholders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-plugin-generator-'))
  for (const kind of ['connector', 'policy']) {
    const destination = join(root, `${kind}-example`)
    await createPlugin({ name: `${kind}-example`, kind, out: destination })
    const packageJson = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'))
    assert.equal(packageJson.name, kind === 'connector' ? 'dsh-plugin-connector-example' : 'dsh-policy-policy-example')
    const source = await readFile(join(destination, 'src/index.js'), 'utf8')
    assert.equal(source.includes('{{'), false)
  }
})
