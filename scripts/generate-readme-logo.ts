import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const WIDTH = 480
const HEIGHT = 120
const FRAMES_PER_SECOND = 30
const OUTPUT_PATH = resolve('.github/assets/rastermaster-logo.png')

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    Bun.which('google-chrome'),
    Bun.which('chromium'),
    Bun.which('chromium-browser'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]

  const chromePath = candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)))
  if (!chromePath) {
    throw new Error('Chrome or Chromium was not found. Set CHROME_PATH to its executable.')
  }

  return chromePath
}

async function runFfmpeg(frameDirectory: string): Promise<void> {
  const ffmpeg = Bun.which('ffmpeg')
  if (!ffmpeg) throw new Error('ffmpeg is required to create the animated PNG.')

  const ffmpegProcess = Bun.spawn([
    ffmpeg,
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-framerate', String(FRAMES_PER_SECOND),
    '-i', join(frameDirectory, 'frame-%03d.png'),
    '-plays', '0',
    '-pred', 'mixed',
    '-f', 'apng',
    OUTPUT_PATH,
  ], { stdout: 'inherit', stderr: 'inherit' })

  if (await ffmpegProcess.exited !== 0) throw new Error('ffmpeg failed to create the animated PNG.')
}

const frameDirectory = await mkdtemp(join(tmpdir(), 'rastermaster-readme-logo-'))
const browser = await chromium.launch({ headless: true, executablePath: findChrome() })

try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  })

  await page.goto(pathToFileURL(resolve('dist/index.html')).href, { waitUntil: 'load' })
  await page.locator('.brand').waitFor()
  await page.evaluate(() => document.fonts.ready)

  const durationSeconds = await page.locator('.brand-raster-scan animate').evaluate((animation) => {
    const duration = animation.getAttribute('dur')
    const match = duration?.match(/^(\d+(?:\.\d+)?)(ms|s)$/)
    if (!match) throw new Error(`Unsupported logo animation duration: ${duration}`)
    return Number(match[1]) / (match[2] === 'ms' ? 1000 : 1)
  })

  await page.addStyleTag({ content: `
    html, body {
      width: ${WIDTH}px !important;
      height: ${HEIGHT}px !important;
      min-height: ${HEIGHT}px !important;
      overflow: hidden !important;
    }

    .app-content {
      width: 100% !important;
      max-width: none !important;
    }

    .header {
      width: 100% !important;
      height: ${HEIGHT}px !important;
      padding: 0 !important;
      justify-content: center !important;
    }

    .brand {
      margin-left: 0 !important;
      transform: scale(1.25);
    }

    .menu-container,
    .container,
    .settings-modal {
      display: none !important;
    }
  ` })

  const frameCount = Math.round(FRAMES_PER_SECOND * durationSeconds)
  for (let frame = 0; frame < frameCount; frame++) {
    await page.evaluate((time) => {
      const logo = document.querySelector<SVGSVGElement>('.brand-raster')
      logo?.pauseAnimations()
      logo?.setCurrentTime(time)
    }, frame / FRAMES_PER_SECOND)

    await page.screenshot({
      path: join(frameDirectory, `frame-${String(frame).padStart(3, '0')}.png`),
    })
  }

  await mkdir(resolve('.github/assets'), { recursive: true })
  await runFfmpeg(frameDirectory)
  console.log(`Generated ${OUTPUT_PATH}`)
} finally {
  await browser.close()
  await rm(frameDirectory, { recursive: true, force: true })
}
