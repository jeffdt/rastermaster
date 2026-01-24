// src/preview.test.ts
import { describe, expect, test } from 'bun:test'
import { generatePreviewSVG } from './preview'
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'

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
