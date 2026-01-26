// src/gcode.test.ts
import { describe, expect, test } from 'bun:test'
import { generateGCode } from './gcode'
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'

/**
 * Helper function to verify snaking pattern behavior in GCode output.
 * Tests that:
 * 1. There are no retracts during the pass (single Z level)
 * 2. Stepover moves use G1 (feed rate) and only move in the stepover axis
 * 3. Cutting moves alternate direction (snaking pattern)
 */
function verifySnakingPattern(
  gcode: string,
  axis: 'x' | 'y'
): void {
  // Split into lines for analysis
  const lines = gcode.split('\n')

  // Find the pass section (between first plunge and final retract)
  const firstPlungeIdx = lines.findIndex(l => l.includes('G1 Z-') && l.includes('Plunge'))
  const finalRetractIdx = lines.findIndex(l => l.includes('Final retract'))
  const passLines = lines.slice(firstPlungeIdx, finalRetractIdx)

  // Count retracts in the pass (should be 0)
  const retractCount = passLines.filter(l => l.includes('G0 Z')).length
  expect(retractCount).toBe(0)

  // Verify stepover moves use G1 (feed rate)
  const stepoverLines = passLines.filter(l => l.includes('Stepover'))
  expect(stepoverLines.length).toBeGreaterThan(0)

  const stepoverAxis = axis === 'x' ? 'Y' : 'X' // X-axis raster steps in Y, Y-axis raster steps in X
  const cutAxis = axis === 'x' ? 'X' : 'Y' // X-axis raster cuts in X, Y-axis raster cuts in Y

  stepoverLines.forEach(line => {
    expect(line).toContain('G1')
    expect(line).toContain(stepoverAxis)
    expect(line).not.toContain(cutAxis) // Should only move in stepover axis
  })

  // Verify cutting moves alternate direction
  // Extract coordinates from cut lines to verify snaking pattern
  const cutLines = passLines.filter(l => l.includes('Cut'))
  expect(cutLines.length).toBeGreaterThan(1)

  const coords = cutLines
    .map(line => {
      const match = line.match(new RegExp(`${cutAxis}([-\\d.]+)`))
      return match ? parseFloat(match[1]) : null
    })
    .filter(c => c !== null)

  // In a snaking pattern, consecutive cuts should move to opposite ends
  // (e.g., X=0 then X=2, then X=0, then X=2, etc. for X-axis raster)
  if (coords.length >= 2) {
    const isSnaking = coords.every((coord, i) => {
      if (i === 0) return true // first line can be any direction
      const prev = coords[i - 1]
      // Consecutive cuts should be at opposite ends (different coordinate values)
      return Math.abs(coord - prev) > 0.1 // tolerance for floating point
    })
    // This check will fail until snaking is implemented
    expect(isSnaking).toBe(true)
  }
}

describe('generateGCode', () => {
  test('generates correct preamble', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      spindleRpm: 18000,
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    expect(gcode).toContain('G90')
    expect(gcode).toContain('G20')
    expect(gcode).toContain('M3 S18000')
  })

  test('generates correct postamble', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      retractHeight: 0.125,
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    expect(gcode).toContain('M5')
    expect(gcode).toContain('M30')
  })

  test('inserts M0 for pause', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      numPasses: 2,
      pauseInterval: 1, // pause every pass
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    // Should have M0 after first pass but not after second (last)
    const m0Count = (gcode.match(/M0\b/g) || []).length
    expect(m0Count).toBe(1)
  })

  test('uses correct feed rates', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      feedRate: 125,
      plungeRate: 12,
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    expect(gcode).toContain('F125')
    expect(gcode).toContain('F12')
  })

  test('X-axis raster uses snaking pattern with single retract per pass', () => {
    // Test scenario: 2"x2" stock with 1" bit at 50% stepover
    // This produces 6 raster lines (Y positions: -0.25, 0.25, 0.75, 1.25, 1.75, 2.25)
    // With snaking, lines should alternate: left-to-right, right-to-left, left-to-right, etc.
    const params = mergeWithDefaults({
      stockWidth: 2,
      stockHeight: 2,
      bitDiameter: 1,
      stepoverPercent: 50,
      rasterDirection: 'x',
      numPasses: 1,
      skimPass: false,
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    verifySnakingPattern(gcode, 'x')
  })

  test('Y-axis raster uses snaking pattern with single retract per pass', () => {
    // Test scenario: 2"x2" stock with 1" bit at 50% stepover
    // This produces 6 raster lines (X positions: -0.25, 0.25, 0.75, 1.25, 1.75, 2.25)
    // With snaking, lines should alternate: bottom-to-top, top-to-bottom, bottom-to-top, etc.
    const params = mergeWithDefaults({
      stockWidth: 2,
      stockHeight: 2,
      bitDiameter: 1,
      stepoverPercent: 50,
      rasterDirection: 'y',
      numPasses: 1,
      skimPass: false,
    })
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    verifySnakingPattern(gcode, 'y')
  })
})
