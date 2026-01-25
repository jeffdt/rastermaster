// src/gcode.ts
import type { Toolpath, ZPass, RasterLine } from './toolpath'

export function generateGCode(toolpath: Toolpath): string {
  const { params } = toolpath
  const lines: string[] = []

  // Preamble
  lines.push('; Surfacing operation')
  lines.push(`; Stock: ${params.stockWidth}" x ${params.stockHeight}"`)
  lines.push(`; Bit: ${params.bitDiameter}" fly cutter`)
  lines.push(`; Stepover: ${params.stepoverPercent}%`)
  lines.push('')
  lines.push('G90 ; Absolute positioning')
  lines.push('G20 ; Inches')
  lines.push(`M3 S${params.spindleRpm} ; Spindle on`)
  lines.push(`G0 Z${fmt(params.safeZ)} ; Retract to safe Z`)

  // Move to start position
  const firstLine = toolpath.passes[0]?.lines[0]
  const startX = params.rasterDirection === 'x'
    ? (firstLine?.xStart ?? toolpath.bounds.xMin)
    : (firstLine?.x ?? toolpath.bounds.xMin)
  const startY = params.rasterDirection === 'x'
    ? (firstLine?.y ?? toolpath.bounds.yMin)
    : (firstLine?.yStart ?? toolpath.bounds.yMin)
  lines.push(`G0 X${fmt(startX)} Y${fmt(startY)} ; Move to start`)
  lines.push('')

  // Generate passes
  toolpath.passes.forEach((pass, passIndex) => {
    lines.push(`; Pass ${passIndex + 1} at Z=${fmt(pass.z)}`)
    lines.push(...generatePass(pass, params.safeZ, params.feedRate, params.plungeRate, params.rasterDirection))

    if (pass.pauseAfter) {
      lines.push('M0 ; Pause - press resume to continue or stop to end')
    }
    lines.push('')
  })

  // Postamble
  lines.push(`G0 Z${fmt(params.safeZ)} ; Final retract`)
  lines.push('M5 ; Spindle off')
  lines.push('M30 ; Program end')

  return lines.join('\n')
}

/**
 * Generates GCode for a single Z-depth pass using a snaking raster pattern.
 *
 * The bit plunges once at the start, then stays at cutting depth while:
 * 1. Cutting the first line
 * 2. Stepping over to the next line at feed rate (G1)
 * 3. Cutting the next line in the opposite direction
 * 4. Repeating until all lines are complete
 * 5. Retracting once at the end
 *
 * Stepover moves use G1 (feed rate) instead of G0 (rapid) for safety - if
 * material exists outside the defined stock bounds, the bit will cut through
 * it at a controlled speed rather than breaking on a rapid move.
 *
 * @param pass - The Z pass with raster lines
 * @param safeZ - Safe retract height
 * @param feedRate - Cutting feed rate (in/min)
 * @param plungeRate - Z-axis plunge rate (in/min)
 * @param direction - Raster direction ('x' or 'y')
 * @returns Array of GCode command strings
 */
function generatePass(pass: ZPass, safeZ: number, feedRate: number, plungeRate: number, direction: 'x' | 'y'): string[] {
  const lines: string[] = []

  pass.lines.forEach((line, lineIndex) => {
    if (direction === 'x') {
      // X-axis raster
      if (lineIndex === 0) {
        // First line: rapid to start, plunge, cut
        lines.push(`G0 Y${fmt(line.y!)}`)
        lines.push(`G0 X${fmt(line.xStart!)}`)
        lines.push(`G1 Z${fmt(pass.z)} F${plungeRate} ; Plunge`)
        lines.push(`G1 X${fmt(line.xEnd!)} F${feedRate} ; Cut`)
      } else {
        // Subsequent lines: stepover at cutting depth, then cut
        lines.push(`G1 Y${fmt(line.y!)} F${feedRate} ; Stepover`)
        lines.push(`G1 X${fmt(line.xEnd!)} F${feedRate} ; Cut`)
      }
    } else {
      // Y-axis raster
      if (lineIndex === 0) {
        // First line: rapid to start, plunge, cut
        lines.push(`G0 X${fmt(line.x!)}`)
        lines.push(`G0 Y${fmt(line.yStart!)}`)
        lines.push(`G1 Z${fmt(pass.z)} F${plungeRate} ; Plunge`)
        lines.push(`G1 Y${fmt(line.yEnd!)} F${feedRate} ; Cut`)
      } else {
        // Subsequent lines: stepover at cutting depth, then cut
        lines.push(`G1 X${fmt(line.x!)} F${feedRate} ; Stepover`)
        lines.push(`G1 Y${fmt(line.yEnd!)} F${feedRate} ; Cut`)
      }
    }
  })

  return lines
}

function fmt(n: number): string {
  // Format number to 4 decimal places, removing trailing zeros
  return n.toFixed(4).replace(/\.?0+$/, '')
}
