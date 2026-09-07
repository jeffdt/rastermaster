import { createHash } from 'node:crypto'

/**
 * Source files whose contents can change what the demo recording shows.
 *
 * Deliberately excludes the toolpath/gcode modules: they change what the app
 * computes, not what the camera sees, and regenerating a multi-megabyte GIF for
 * a pixel-identical result only bloats git history.
 */
export const WATCHED_FILES = ['index.html', 'src/main.ts', 'src/preview.ts', 'src/ui.ts'] as const

export interface WatchedFile {
  path: string
  content: string
}

/** Path where the hash of the last captured recording is stored. */
export const HASH_PATH = 'docs/demo.gif.hash'

/** Path of the recording itself, relative to the repo root. */
export const GIF_PATH = 'docs/demo.gif'

/**
 * Digests the watched files into a stable fingerprint of the app's appearance.
 *
 * Sorted by path so caller order never matters, and each entry is length-prefixed
 * so two files swapping contents cannot produce the same digest.
 */
export function computeUiHash(files: WatchedFile[]): string {
  const hash = createHash('sha256')

  for (const { path, content } of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(`${path.length}:${path}:${content.length}:${content}`)
  }

  return hash.digest('hex')
}
