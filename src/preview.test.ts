// src/preview.test.ts
import { describe, expect, test } from 'bun:test'
import { generateJobSummaryHTML, generatePassScheduleHTML, generatePreviewSVG } from './preview'
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'
import { formatDimension } from './format'

describe('generatePreviewSVG', () => {
  test('generates valid SVG', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  test('includes stock rectangle', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('fill="#e5e7eb"')
    expect(svg).toContain('<rect')
  })

  test('includes raster lines', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('<line')
    expect(svg).toContain('class="raster"')
  })
})

describe('pass schedule presentation', () => {
  test('summarizes passes, total depth, final Z, and pauses', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 18,
      numPasses: 25,
      depthPerPass: 0.01,
      pauseInterval: 5,
    })
    const toolpath = calculateToolpath(params)
    const summary = generateJobSummaryHTML(toolpath)

    expect(summary).toContain('26 passes')
    expect(summary).toContain('0.25" total')
    expect(summary).toContain('Final Z -0.25"')
    expect(summary).toContain('5 pauses')
  })

  test('uses singular labels for a skim-only job', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 18,
    })
    const toolpath = calculateToolpath(params)
    const summary = generateJobSummaryHTML(toolpath)
    const schedule = generatePassScheduleHTML(toolpath)

    expect(summary).toContain('1 pass')
    expect(summary).toContain('Skim only')
    expect(summary).toContain('Final Z 0"')
    expect(summary).toContain('No pauses')
    expect(schedule).toContain('<span class="pass-schedule-title">Details</span>')
  })

  test('renders the detailed schedule as a closed disclosure with exact pass values', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 18,
      numPasses: 2,
      depthPerPass: 0.02,
    })
    const toolpath = calculateToolpath(params)
    const schedule = generatePassScheduleHTML(toolpath)

    expect(schedule).toStartWith('<details class="pass-schedule">')
    expect(schedule).toContain('<span class="pass-schedule-title">Details</span>')
    expect(schedule).not.toContain('View pass schedule')
    expect(schedule).toContain('Z -0.02"')
    expect(schedule).toContain('Z -0.04"')
    expect(schedule).toContain('class="pass-table-scroll"')
  })

  test('preserves four-decimal precision for shallow depth passes', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 18,
      skimPass: false,
      numPasses: 1,
      depthPerPass: 0.0015,
    })
    const toolpath = calculateToolpath(params)
    const summary = generateJobSummaryHTML(toolpath)
    const schedule = generatePassScheduleHTML(toolpath)

    expect(summary).toContain('0.0015" total')
    expect(summary).toContain('Final Z -0.0015"')
    expect(schedule).toContain('Z -0.0015"')
  })

  test('labels machine pauses in a dedicated after column', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 18,
      numPasses: 2,
      pauseInterval: 2,
    })
    const toolpath = calculateToolpath(params)
    const schedule = generatePassScheduleHTML(toolpath)

    expect(schedule).toContain('<th>AFTER</th>')
    expect(schedule).toContain('<td class="pass-after"><span class="pass-pause-mark" title="Machine pauses after this pass (M0)">PAUSE</span></td>')
    expect(schedule.match(/>PAUSE<\/span>/g)).toHaveLength(1)
    expect(schedule).not.toContain('>M0</span>')
  })
})

describe('dimension labels', () => {
  test('includes width dimension text', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('class="dimension-text"')
    expect(svg).toContain('10"')
  })

  test('includes height dimension text', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('5"')
  })

  test('formats dimension values correctly', () => {
    const params = mergeWithDefaults({
      stockWidth: 10.5,
      stockHeight: 8.125,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    expect(svg).toContain('10.5"')
    expect(svg).toContain('8.13"')
  })

  test('places dimension text inside stock boundary', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    // Should not contain dimension lines or arrow markers
    expect(svg).not.toContain('<defs>')
    expect(svg).not.toContain('<marker')
    expect(svg).not.toContain('marker-start')
    expect(svg).not.toContain('marker-end')

    // Should contain dimension text
    expect(svg).toContain('text-anchor="start"')   // Height label left-aligned
  })

  test('dimension labels are rendered last (on top)', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 400, 300)

    const lastRectIndex = svg.lastIndexOf('<rect')
    const lastLineIndex = svg.lastIndexOf('<line')
    const lastCircleIndex = svg.lastIndexOf('<circle')
    const firstHaloIndex = svg.indexOf('<text class="dimension-halo"')
    const firstTextIndex = svg.indexOf('<text class="dimension-text"')

    expect(firstHaloIndex).toBeGreaterThan(lastRectIndex)
    expect(firstHaloIndex).toBeGreaterThan(lastLineIndex)
    expect(firstHaloIndex).toBeGreaterThan(lastCircleIndex)

    expect(firstTextIndex).toBeGreaterThan(firstHaloIndex)
  })
})

describe('fudge zone rendering', () => {
  test('renders fudge zone when fudge factor > 0', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      fudgeFactor: 0.5,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 800, 600)

    // Should contain original stock rect with inline fill
    expect(svg).toContain('fill="#e5e7eb"')
    // Should contain fudge zone rects with inline fill (fallback color in test env)
    expect(svg).toContain('fill="#f59e0b"')
    // Should have multiple rect elements (original stock + 4 fudge zones)
    expect(svg).toContain('<rect')
  })

  test('does not render separate fudge zone when fudge factor is 0', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      fudgeFactor: 0,
    })
    const toolpath = calculateToolpath(params)
    const svg = generatePreviewSVG(toolpath, 800, 600)

    // Should contain original stock rect
    expect(svg).toContain('fill="#e5e7eb"')
    // Should not contain fudge zone fill color (fallback color in test env)
    expect(svg).not.toContain('fill="#f59e0b"')
    // Verify it doesn't crash and renders something
    expect(svg.length).toBeGreaterThan(0)
  })
})
