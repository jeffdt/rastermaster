// src/types.test.ts
import { describe, expect, test } from 'bun:test'
import { DEFAULT_PARAMS } from './defaults'

describe('DEFAULT_PARAMS', () => {
  test('has correct default values', () => {
    expect(DEFAULT_PARAMS.bitDiameter).toBe(1.25)
    expect(DEFAULT_PARAMS.stepoverPercent).toBe(50)
    expect(DEFAULT_PARAMS.rasterDirection).toBe('x')
    expect(DEFAULT_PARAMS.skimPass).toBe(false)
    expect(DEFAULT_PARAMS.numPasses).toBe(1)
    expect(DEFAULT_PARAMS.depthPerPass).toBe(0.01)
    expect(DEFAULT_PARAMS.pauseInterval).toBe(0) // 0 = disabled
    expect(DEFAULT_PARAMS.feedRate).toBe(125)
    expect(DEFAULT_PARAMS.plungeRate).toBe(12)
    expect(DEFAULT_PARAMS.spindleRpm).toBe(18000)
    expect(DEFAULT_PARAMS.safeZ).toBe(0.125)
  })
})
