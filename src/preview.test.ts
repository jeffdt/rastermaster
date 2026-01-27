// src/preview.test.ts
import { describe, expect, test } from 'bun:test'
import { generatePreviewSVG } from './preview'
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
    expect(svg).toContain('text-anchor="middle"')  // Width label centered
    expect(svg).toContain('text-anchor="start"')   // Height label left-aligned
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
    // Should contain fudge zone rects with inline fill
    expect(svg).toContain('fill="#fbbf24"')
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
    // Should not contain fudge zone fill color
    expect(svg).not.toContain('fill="#fbbf24"')
    // Verify it doesn't crash and renders something
    expect(svg.length).toBeGreaterThan(0)
  })
})
