// src/types.ts
export interface SurfacingParams {
  // Stock dimensions (required, no defaults)
  stockWidth: number
  stockHeight: number
  fudgeFactor: number // Margin in inches to add to each side

  // Tool settings
  bitDiameter: number
  stepoverPercent: number

  // Toolpath settings
  rasterDirection: 'x' | 'y'
  skimPass: boolean
  totalDepth: number
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

export interface ToolSettings {
  bitDiameter: number
  stepoverPercent: number
  feedRate: number
  plungeRate: number
  spindleRpm: number
  retractHeight: number
  depthPerPass: number
}
