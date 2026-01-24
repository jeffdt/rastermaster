// src/gcode.test.ts
import { describe, expect, test } from 'bun:test'
import { generateGCode } from './gcode'
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'

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
      safeZ: 0.125,
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
})
