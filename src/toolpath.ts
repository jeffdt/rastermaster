// src/toolpath.ts
import type { SurfacingParams } from './types'

export interface RasterLine {
  // For X-axis raster: y is fixed, x varies
  // For Y-axis raster: x is fixed, y varies
  x?: number
  y?: number
  xStart?: number
  xEnd?: number
  yStart?: number
  yEnd?: number
  direction: 'positive' | 'negative'
}

export interface ZPass {
  z: number
  type: 'skim' | 'depth'
  lines: RasterLine[]
  pauseAfter: boolean
}

export interface Toolpath {
  passes: ZPass[]
  bounds: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  originalStockBounds: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  params: SurfacingParams
}

/**
 * Calculates the toolpath for a CNC surfacing operation.
 *
 * Overhang Logic:
 * - Raster direction (along line travel): Always bitDiameter/2
 *   - Ensures bit fully exits stock on both ends of each pass
 *   - Eliminates cross-grain cutting at extrema
 * - Stepping direction (perpendicular): bitDiameter/2 - stepover (Full mode) or customOverhang
 *   - Positions first pass optimally to cut exactly one stepover width from edge
 *   - Minimizes wasted travel while ensuring complete coverage
 *
 * Examples (X-axis raster with 1.25" bit @ 50% stepover):
 *   - X bounds: [-0.625, stockWidth + 0.625] (full overhang)
 *   - Y bounds: [0, stockHeight] (optimized overhang = 0.625 - 0.625 = 0)
 */
export function calculateToolpath(params: SurfacingParams): Toolpath {
  // Apply fudge factor (margin) to stock dimensions (centered expansion)
  const fudgeAmountWidth = params.fudgeFactor
  const fudgeAmountHeight = params.fudgeFactor

  // Fudged stock bounds (centered around original stock)
  const fudgedStockXMin = -fudgeAmountWidth
  const fudgedStockXMax = params.stockWidth + fudgeAmountWidth
  const fudgedStockYMin = -fudgeAmountHeight
  const fudgedStockYMax = params.stockHeight + fudgeAmountHeight

  const stepover = params.bitDiameter * (params.stepoverPercent / 100)
  const bitRadius = params.bitDiameter / 2
  const steppingOverhang = bitRadius - stepover

  // Calculate bounds with direction-specific overhang
  let xMin: number, xMax: number, yMin: number, yMax: number

  if (params.rasterDirection === 'x') {
    // X-axis raster: lines travel in X (full overhang), step in Y (optimized)
    xMin = fudgedStockXMin - bitRadius
    xMax = fudgedStockXMax + bitRadius
    yMin = fudgedStockYMin - steppingOverhang
    yMax = fudgedStockYMax + steppingOverhang
  } else {
    // Y-axis raster: lines travel in Y (full overhang), step in X (optimized)
    xMin = fudgedStockXMin - steppingOverhang
    xMax = fudgedStockXMax + steppingOverhang
    yMin = fudgedStockYMin - bitRadius
    yMax = fudgedStockYMax + bitRadius
  }

  // Generate raster lines based on direction
  let linePositions: number[] = []

  if (params.rasterDirection === 'x') {
    // Lines run along X, step over in Y
    let y = yMin
    do {
      linePositions.push(y)
      y += stepover
    } while (linePositions[linePositions.length - 1] < yMax)
  } else {
    // Lines run along Y, step over in X
    let x = xMin
    do {
      linePositions.push(x)
      x += stepover
    } while (linePositions[linePositions.length - 1] < xMax)
  }

  // Build raster lines template (same for every pass)
  const buildLines = (): RasterLine[] => linePositions.map((pos, lineIndex) => {
    const isEven = lineIndex % 2 === 0

    if (params.rasterDirection === 'x') {
      return {
        y: pos,
        xStart: isEven ? xMin : xMax,
        xEnd: isEven ? xMax : xMin,
        direction: isEven ? 'positive' : 'negative',
      }
    } else {
      return {
        x: pos,
        yStart: isEven ? yMin : yMax,
        yEnd: isEven ? yMax : yMin,
        direction: isEven ? 'positive' : 'negative',
      }
    }
  })

  // Build pass descriptors (z and type)
  const depthPassCount = params.totalDepth > 0
    ? Math.ceil(params.totalDepth / params.depthPerPass - 1e-9)
    : 0

  const passDescriptors: { z: number; type: 'skim' | 'depth' }[] = []

  if (params.skimPass) {
    passDescriptors.push({ z: 0, type: 'skim' })
  }

  for (let i = 1; i <= depthPassCount; i++) {
    const z = -Math.min(i * params.depthPerPass, params.totalDepth)
    passDescriptors.push({ z, type: 'depth' })
  }

  // Generate Z passes
  const totalPasses = passDescriptors.length
  const passes: ZPass[] = passDescriptors.map((desc, i) => {
    const shouldPause = params.pauseInterval > 0 &&
      (i + 1) % params.pauseInterval === 0 &&
      i < totalPasses - 1

    return { z: desc.z, type: desc.type, lines: buildLines(), pauseAfter: shouldPause }
  })

  return {
    passes,
    bounds: { xMin, xMax, yMin, yMax },
    originalStockBounds: {
      xMin: 0,
      xMax: params.stockWidth,
      yMin: 0,
      yMax: params.stockHeight,
    },
    params,
  }
}
