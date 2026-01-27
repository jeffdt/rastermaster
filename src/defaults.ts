// src/defaults.ts
import type { SurfacingParams } from './types'

export const DEFAULT_PARAMS: Omit<SurfacingParams, 'stockWidth' | 'stockHeight'> = {
  fudgeFactor: 0.5,
  bitDiameter: 1.25,
  stepoverPercent: 50,
  rasterDirection: 'x',
  skimPass: false,
  numPasses: 1,
  depthPerPass: 0.01,
  pauseInterval: 0, // 0 = disabled (no pauses)
  feedRate: 125,
  plungeRate: 12,
  spindleRpm: 18000,
  retractHeight: 0.125,
}

export function mergeWithDefaults(partial: { stockWidth: number; stockHeight: number } & Partial<SurfacingParams>): SurfacingParams {
  return {
    ...DEFAULT_PARAMS,
    ...partial,
  }
}
