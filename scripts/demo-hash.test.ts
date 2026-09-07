import { describe, expect, test } from 'bun:test'
import { computeUiHash, WATCHED_FILES, type WatchedFile } from './demo-hash'

const file = (path: string, content: string): WatchedFile => ({ path, content })

describe('computeUiHash', () => {
  test('returns the same hash for identical input', () => {
    const files = [file('index.html', '<h1>hi</h1>'), file('src/ui.ts', 'export const a = 1')]

    expect(computeUiHash(files)).toBe(computeUiHash(files))
  })

  test('changes when file content changes', () => {
    const before = computeUiHash([file('src/ui.ts', 'export const a = 1')])
    const after = computeUiHash([file('src/ui.ts', 'export const a = 2')])

    expect(after).not.toBe(before)
  })

  test('changes when a watched file is renamed', () => {
    const before = computeUiHash([file('src/ui.ts', 'same content')])
    const after = computeUiHash([file('src/form.ts', 'same content')])

    expect(after).not.toBe(before)
  })

  test('changes when a watched file is added', () => {
    const before = computeUiHash([file('index.html', 'a')])
    const after = computeUiHash([file('index.html', 'a'), file('src/main.ts', 'b')])

    expect(after).not.toBe(before)
  })

  test('ignores the order files are supplied in', () => {
    const a = file('index.html', 'a')
    const b = file('src/main.ts', 'b')

    expect(computeUiHash([a, b])).toBe(computeUiHash([b, a]))
  })

  // Two files swapping contents must not collide, which naive concatenation allows.
  test('distinguishes files that swap contents', () => {
    const before = computeUiHash([file('index.html', 'a'), file('src/main.ts', 'b')])
    const after = computeUiHash([file('index.html', 'b'), file('src/main.ts', 'a')])

    expect(after).not.toBe(before)
  })

  test('produces a hex sha256 digest', () => {
    expect(computeUiHash([file('index.html', 'a')])).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('WATCHED_FILES', () => {
  test('covers every source file that can change what the recording shows', () => {
    expect(WATCHED_FILES).toEqual(['index.html', 'src/main.ts', 'src/preview.ts', 'src/ui.ts'])
  })
})
