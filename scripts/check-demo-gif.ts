import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { computeUiHash, GIF_PATH, HASH_PATH, WATCHED_FILES, type WatchedFile } from './demo-hash'

const repoRoot = resolve(import.meta.dir, '..')

function fail(message: string): never {
  console.error(`\n❌ ${message}`)
  console.error('\nThe README demo is out of date. Regenerate it with:')
  console.error('  bun run demo:gif\n')
  process.exit(1)
}

async function readWatchedFiles(): Promise<WatchedFile[]> {
  return Promise.all(
    WATCHED_FILES.map(async path => ({
      path,
      content: await readFile(join(repoRoot, path), 'utf8'),
    }))
  )
}

const gifPath = join(repoRoot, GIF_PATH)
const hashPath = join(repoRoot, HASH_PATH)

if (!existsSync(gifPath)) fail(`Missing ${GIF_PATH}.`)
if (!existsSync(hashPath)) fail(`Missing ${HASH_PATH}.`)

const expected = (await readFile(hashPath, 'utf8')).trim()
const actual = computeUiHash(await readWatchedFiles())

if (expected !== actual) {
  fail(`${GIF_PATH} is stale: the UI has changed since it was recorded.`)
}

console.log('✅ README demo GIF is up to date')
