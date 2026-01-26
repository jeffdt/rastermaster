// src/types.ts
export interface SurfacingParams {
  // Stock dimensions (required, no defaults)
  stockWidth: number
  stockHeight: number

  // Tool settings
  bitDiameter: number
  stepoverPercent: number

  // Toolpath settings
  rasterDirection: 'x' | 'y'
  skimPass: boolean
  numPasses: number
  depthPerPass: number
  pauseInterval: number // 0 = disabled

  // Speeds and feeds
  feedRate: number
  plungeRate: number
  spindleRpm: number
  retractHeight: number
}

export type PartialParams = Partial<SurfacingParams> & {
  stockWidth: number
  stockHeight: number
}
