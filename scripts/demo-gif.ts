import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { computeUiHash, GIF_PATH, HASH_PATH, WATCHED_FILES, type WatchedFile } from './demo-hash'

const repoRoot = resolve(import.meta.dir, '..')
const workDir = join(repoRoot, '.vite', 'demo-capture')

// Tall enough that the form, preview, pass schedule and Generate button all stay in
// frame. Scrolling instead would shift every pixel and defeat the GIF's delta encoding.
const VIEWPORT = { width: 1440, height: 1220 }
const GIF_WIDTH = 720
const FPS = 12

/**
 * Playwright's real cursor is invisible to the video recorder, so without this the
 * demo looks like fields filling themselves in. Draws a dot that follows synthetic
 * mouse events and pulses on click.
 */
const CURSOR_OVERLAY = `
  const dot = document.createElement('div')
  dot.style.cssText = [
    'position:fixed', 'z-index:2147483647', 'pointer-events:none',
    'width:14px', 'height:14px', 'margin:-7px 0 0 -7px', 'border-radius:50%',
    'background:rgba(255,255,255,0.9)', 'border:1.5px solid rgba(0,0,0,0.55)',
    'box-shadow:0 1px 4px rgba(0,0,0,0.4)', 'opacity:0',
    'transition:opacity 120ms linear, transform 120ms ease-out',
  ].join(';')
  const attach = () => document.body && document.body.appendChild(dot)
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', attach)
    : attach()
  addEventListener('mousemove', e => {
    dot.style.opacity = '1'
    dot.style.left = e.clientX + 'px'
    dot.style.top = e.clientY + 'px'
  }, true)
  addEventListener('mousedown', () => { dot.style.transform = 'scale(0.6)' }, true)
  addEventListener('mouseup', () => { dot.style.transform = 'scale(1)' }, true)
`

async function run(command: string[], label: string): Promise<void> {
  const proc = Bun.spawn(command, { cwd: repoRoot, stdout: 'pipe', stderr: 'pipe' })
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    console.error(await new Response(proc.stderr).text())
    throw new Error(`${label} failed (exit ${exitCode})`)
  }
}

/** Glides the cursor to an element's center so the movement reads as deliberate on video. */
async function glideTo(page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).boundingBox()
  if (!box) throw new Error(`Cannot locate ${selector} for cursor movement`)

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 })
}

async function clickAt(page: Page, selector: string): Promise<void> {
  await glideTo(page, selector)
  await page.mouse.down()
  await page.waitForTimeout(90)
  await page.mouse.up()
}

async function typeInto(page: Page, selector: string, value: string): Promise<void> {
  await clickAt(page, selector)
  await page.locator(selector).pressSequentially(value, { delay: 140 })
}

async function recordStoryboard(page: Page): Promise<void> {
  await page.waitForTimeout(1200)

  // Entering stock dimensions triggers the progressive-disclosure cascade, which is
  // the moment the demo exists to show.
  await typeInto(page, '#stockWidth', '24')
  await page.waitForTimeout(400)
  await typeInto(page, '#stockHeight', '18')
  await page.waitForTimeout(1900)

  await clickAt(page, '.radio-group label:has(input[value="y"])')
  await page.waitForTimeout(1500)

  await typeInto(page, '#depthInput', '3')
  await page.waitForTimeout(1500)

  await clickAt(page, '.radio-group label:has(input[value="x"])')
  await page.waitForTimeout(1400)

  await clickAt(page, '#generateBtn')
  await page.waitForTimeout(1600)
}

/**
 * Prefers the Chrome already installed on the machine, which keeps this script off
 * Playwright's ~550MB bundled-browser download. Falls back to a bundled Chromium for
 * contributors without Chrome.
 */
async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    console.log('ℹ️  System Chrome not found, falling back to bundled Chromium')
  }

  try {
    return await chromium.launch()
  } catch {
    console.error('❌ No usable browser. Install Google Chrome, or run:')
    console.error('   bunx playwright install chromium')
    process.exit(1)
  }
}

async function capture(): Promise<string> {
  const browser = await launchBrowser()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: workDir, size: VIEWPORT },
    reducedMotion: 'no-preference',
  })

  const page = await context.newPage()
  await page.addInitScript(CURSOR_OVERLAY)
  await page.goto(`file://${join(repoRoot, 'dist', 'index.html')}`, { waitUntil: 'load' })

  await recordStoryboard(page)

  const video = page.video()
  if (!video) throw new Error('Playwright produced no video')

  await context.close()
  await browser.close()

  return video.path()
}

/**
 * Two-pass palette encode. Dithering is off deliberately: the UI is flat dark panels
 * with no gradients to band, and dithering adds per-frame noise that inflates the GIF
 * by roughly 30% for no visible gain.
 */
async function encodeGif(source: string, destination: string): Promise<void> {
  const palette = join(workDir, 'palette.png')
  const scale = `fps=${FPS},scale=${GIF_WIDTH}:-2:flags=lanczos`

  await run(
    ['ffmpeg', '-y', '-i', source, '-vf', `${scale},palettegen=max_colors=128:stats_mode=diff`, palette],
    'ffmpeg palettegen'
  )

  await run(
    [
      'ffmpeg', '-y', '-i', source, '-i', palette,
      '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
      '-loop', '0', destination,
    ],
    'ffmpeg paletteuse'
  )
}

async function readWatchedFiles(): Promise<WatchedFile[]> {
  return Promise.all(
    WATCHED_FILES.map(async path => ({
      path,
      content: await readFile(join(repoRoot, path), 'utf8'),
    }))
  )
}

if (!Bun.which('ffmpeg')) {
  console.error('❌ ffmpeg is required to encode the GIF. Install it with: brew install ffmpeg')
  process.exit(1)
}

console.log('📦 Building single-file app...')
await run(['bun', 'run', 'build'], 'bun run build')

await rm(workDir, { recursive: true, force: true })
await mkdir(workDir, { recursive: true })
await mkdir(join(repoRoot, 'docs'), { recursive: true })

console.log('🎬 Recording demo...')
const videoPath = await capture()

console.log('🎨 Encoding GIF...')
const gifPath = join(repoRoot, GIF_PATH)
await encodeGif(videoPath, gifPath)

await writeFile(join(repoRoot, HASH_PATH), `${computeUiHash(await readWatchedFiles())}\n`)
await rm(workDir, { recursive: true, force: true })

const bytes = existsSync(gifPath) ? Bun.file(gifPath).size : 0
console.log(`✅ Wrote ${GIF_PATH} (${(bytes / 1_000_000).toFixed(2)} MB) and ${HASH_PATH}`)
