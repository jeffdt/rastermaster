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

    expect(svg).toContain('class="stock"')
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
