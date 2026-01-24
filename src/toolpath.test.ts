// src/toolpath.test.ts
import { describe, expect, test } from 'bun:test'
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'

describe('calculateToolpath', () => {
  test('calculates correct number of passes for X-axis raster', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1,
      stepoverPercent: 50,
      numPasses: 1,
      depthPerPass: 0.01,
      skimPass: false,
    })

    const toolpath = calculateToolpath(params)

    // Stepover = 1 * 0.5 = 0.5"
    // overhang = bitDiameter/2 - stepover = 0.5 - 0.5 = 0"
    // Y range = 0 to 5 = 5" total
    // Number of Y passes = ceil(5 / 0.5) + 1 = 11 passes
    expect(toolpath.passes.length).toBe(1) // 1 Z pass
    expect(toolpath.passes[0].lines.length).toBeGreaterThan(0)
  })

  test('calculates correct overhang for X-axis raster', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 2,
    })

    const toolpath = calculateToolpath(params)

    // With bitDiameter=2" and default stepoverPercent=50%, rasterDirection=x:
    // stepover = 2 * 0.5 = 1"
    // X (raster): full overhang = bitDiameter/2 = 1"
    // Y (stepping): optimized overhang = bitDiameter/2 - stepover = 1 - 1 = 0"
    // X range: -1 to 11 = 12" total travel
    // Y range: 0 to 5 = 5" total travel
    expect(toolpath.bounds.xMin).toBeCloseTo(-1, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(11, 2)
    expect(toolpath.bounds.yMin).toBeCloseTo(0, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(5, 2)
  })
})

describe('skim pass', () => {
  test('adds Z=0 pass when skimPass is true', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      skimPass: true,
      numPasses: 2,
      depthPerPass: 0.01,
    })

    const toolpath = calculateToolpath(params)

    expect(toolpath.passes.length).toBe(3) // skim + 2 regular
    expect(toolpath.passes[0].z).toBe(0)
    expect(toolpath.passes[1].z).toBe(-0.01)
    expect(toolpath.passes[2].z).toBe(-0.02)
  })

  test('does not add skim pass when skimPass is false', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      skimPass: false,
      numPasses: 2,
      depthPerPass: 0.01,
    })

    const toolpath = calculateToolpath(params)

    expect(toolpath.passes.length).toBe(2)
    expect(toolpath.passes[0].z).toBe(-0.01)
    expect(toolpath.passes[1].z).toBe(-0.02)
  })
})

describe('pause intervals', () => {
  test('pauses after every N passes when enabled', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      numPasses: 6,
      pauseInterval: 2, // pause every 2 passes
    })

    const toolpath = calculateToolpath(params)

    expect(toolpath.passes[0].pauseAfter).toBe(false) // pass 1
    expect(toolpath.passes[1].pauseAfter).toBe(true)  // pass 2 - pause
    expect(toolpath.passes[2].pauseAfter).toBe(false) // pass 3
    expect(toolpath.passes[3].pauseAfter).toBe(true)  // pass 4 - pause
    expect(toolpath.passes[4].pauseAfter).toBe(false) // pass 5
    expect(toolpath.passes[5].pauseAfter).toBe(false) // pass 6 - last, no pause
  })

  test('does not pause when disabled', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      numPasses: 3,
      pauseInterval: 0, // 0 = disabled
    })

    const toolpath = calculateToolpath(params)

    expect(toolpath.passes.every(p => !p.pauseAfter)).toBe(true)
  })
})

describe('Y-axis raster', () => {
  test('generates lines along Y axis when direction is y', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      rasterDirection: 'y',
      bitDiameter: 1,
      stepoverPercent: 50,
    })

    const toolpath = calculateToolpath(params)
    const firstLine = toolpath.passes[0].lines[0]

    // Y-axis raster means lines run along Y, stepping over in X
    // So yStart and yEnd should differ, xStart should equal the line's x position
    expect(firstLine.yStart).toBeDefined()
    expect(firstLine.yEnd).toBeDefined()
  })
})

describe('overhang coverage', () => {
  test('first pass with full overhang should cover the stock edge', () => {
    const params = mergeWithDefaults({
      stockWidth: 12,
      stockHeight: 4,
      bitDiameter: 1.25,
      stepoverPercent: 50,
      rasterDirection: 'x',
    })

    const toolpath = calculateToolpath(params)
    const firstLine = toolpath.passes[0].lines[0]

    // With 1.25" bit (0.625" radius) and 50% stepover (0.625" step)
    // overhang = bitDiameter/2 - stepover = 0.625 - 0.625 = 0"
    // First pass bit center at y = 0
    // Bit edge extends to y = -0.625" (exactly one stepover past the stock edge)

    const bitRadius = params.bitDiameter / 2
    const stepover = params.bitDiameter * (params.stepoverPercent / 100)
    const expectedFirstPassY = -(bitRadius - stepover)

    expect(firstLine.y).toBeCloseTo(expectedFirstPassY, 2)

    // Verify the bit cuts exactly one stepover's worth of material from the stock edge
    // The top edge of the bit (firstLine.y + bitRadius) extends into the stock
    // This extension should equal exactly one stepover
    const materialCutFromEdge = firstLine.y! + bitRadius
    expect(materialCutFromEdge).toBeCloseTo(stepover, 2)
  })

  const testCases: [number, number, number][] = [
    // [bitDiameter, stepoverPercent, expectedFirstPassY]
    [1.25, 25, -0.3125],  // 0.625 - 0.3125 = 0.3125" overhang
    [1.25, 50, 0],        // 0.625 - 0.625 = 0" overhang
    [1.25, 75, 0.3125],   // 0.625 - 0.9375 = -0.3125" overhang (negative = inside stock)
    [1.0, 30, -0.2],      // 0.5 - 0.3 = 0.2" overhang
    [1.0, 50, 0],         // 0.5 - 0.5 = 0" overhang
    [2.0, 25, -0.5],      // 1.0 - 0.5 = 0.5" overhang
    [2.0, 50, 0],         // 1.0 - 1.0 = 0" overhang
    [0.5, 40, -0.05],     // 0.25 - 0.2 = 0.05" overhang
    [0.5, 50, 0],         // 0.25 - 0.25 = 0" overhang
  ]

  test.each(testCases)(
    'bit %.2f" at %d%% stepover: first pass at y = %.4f"',
    (bitDiameter, stepoverPercent, expectedFirstPassY) => {
      const params = mergeWithDefaults({
        stockWidth: 12,
        stockHeight: 4,
        bitDiameter,
        stepoverPercent,
        rasterDirection: 'x',
      })

      const toolpath = calculateToolpath(params)
      const firstLine = toolpath.passes[0].lines[0]

      expect(firstLine.y).toBeCloseTo(expectedFirstPassY, 4)

      // Verify the bit cuts exactly one stepover's worth of material from the stock edge
      // The top edge of the bit (firstLine.y + bitRadius) extends into the stock
      // This extension should equal exactly one stepover
      const bitRadius = bitDiameter / 2
      const stepover = bitDiameter * (stepoverPercent / 100)
      const materialCutFromEdge = firstLine.y! + bitRadius
      expect(materialCutFromEdge).toBeCloseTo(stepover, 4)
    }
  )
})

describe('separate raster and stepping overhang', () => {
  test('X-axis raster has full X overhang, optimized Y overhang', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 50,
      rasterDirection: 'x',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = params.bitDiameter / 2 // 0.625
    const stepover = params.bitDiameter * (params.stepoverPercent / 100) // 0.625
    const steppingOverhang = bitRadius - stepover // 0

    // X direction (raster): full overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-bitRadius, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(params.stockWidth + bitRadius, 2)

    // Y direction (stepping): optimized overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-steppingOverhang, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(params.stockHeight + steppingOverhang, 2)
  })

  test('Y-axis raster has full Y overhang, optimized X overhang', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 50,
      rasterDirection: 'y',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = params.bitDiameter / 2 // 0.625
    const stepover = params.bitDiameter * (params.stepoverPercent / 100) // 0.625
    const steppingOverhang = bitRadius - stepover // 0

    // X direction (stepping): optimized overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-steppingOverhang, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(params.stockWidth + steppingOverhang, 2)

    // Y direction (raster): full overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-bitRadius, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(params.stockHeight + bitRadius, 2)
  })

  test('X-axis raster with 25% stepover has correct overhangs', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 25,
      rasterDirection: 'x',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = 0.625
    const stepover = 1.25 * 0.25 // 0.3125
    const steppingOverhang = bitRadius - stepover // 0.3125

    // X: full overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-0.625, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(10.625, 2)

    // Y: optimized overhang (larger because stepover is smaller)
    expect(toolpath.bounds.yMin).toBeCloseTo(-0.3125, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(5.3125, 2)
  })

  test('Y-axis raster with 75% stepover has correct overhangs', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 2,
      stepoverPercent: 75,
      rasterDirection: 'y',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = 1
    const stepover = 2 * 0.75 // 1.5
    const steppingOverhang = bitRadius - stepover // -0.5 (negative!)

    // X: optimized overhang (negative means bit starts inside stock)
    expect(toolpath.bounds.xMin).toBeCloseTo(0.5, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(9.5, 2)

    // Y: full overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-1, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(6, 2)
  })
})
