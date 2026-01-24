// src/preview.ts
import type { Toolpath } from './toolpath'
import { formatDimension } from './format'

export function generatePreviewSVG(toolpath: Toolpath, width: number, height: number): string {
  const { bounds, params } = toolpath
  const padding = 20

  // Calculate scale to fit preview
  const contentWidth = bounds.xMax - bounds.xMin
  const contentHeight = bounds.yMax - bounds.yMin
  const scaleX = (width - 2 * padding) / contentWidth
  const scaleY = (height - 2 * padding) / contentHeight
  const scale = Math.min(scaleX, scaleY)

  // Transform functions (flip Y axis for SVG coordinates)
  const tx = (x: number) => padding + (x - bounds.xMin) * scale
  const ty = (y: number) => height - padding - (y - bounds.yMin) * scale

  const lines: string[] = []

  lines.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`)

  // Arrow marker definitions
  lines.push('<defs>')
  lines.push('  <marker id="arrow" viewBox="0 0 10 10" markerWidth="6" markerHeight="6" refX="5" refY="5" orient="auto">')
  lines.push('    <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>')
  lines.push('  </marker>')
  lines.push('</defs>')

  // Styles
  lines.push('<style>')
  lines.push('  .stock { fill: #f5f5dc; stroke: #8b7355; stroke-width: 2; }')
  lines.push('  .overhang { fill: none; stroke: #ccc; stroke-width: 1; stroke-dasharray: 4; }')
  lines.push('  .raster { stroke: #2196F3; stroke-width: 1; opacity: 0.7; }')
  lines.push('  .start { fill: #4CAF50; }')
  lines.push('  .dimension { stroke: #999; stroke-width: 1; }')
  lines.push('  .dimension-text { fill: #999; font-size: 12px; font-family: Arial, sans-serif; }')
  lines.push('</style>')

  // Overhang area (dashed rectangle)
  lines.push(`<rect class="overhang" x="${tx(bounds.xMin)}" y="${ty(bounds.yMax)}" width="${contentWidth * scale}" height="${contentHeight * scale}" />`)

  // Stock rectangle
  lines.push(`<rect class="stock" x="${tx(0)}" y="${ty(params.stockHeight)}" width="${params.stockWidth * scale}" height="${params.stockHeight * scale}" />`)

  // Dimension lines
  const dimOffset = 15 // pixels outside stock boundary

  // Bottom dimension (width)
  const bottomY = ty(0) + dimOffset
  const bottomX1 = tx(0)
  const bottomX2 = tx(params.stockWidth)
  const bottomTextX = (bottomX1 + bottomX2) / 2
  lines.push(`<line class="dimension" x1="${bottomX1}" y1="${bottomY}" x2="${bottomX2}" y2="${bottomY}" marker-start="url(#arrow)" marker-end="url(#arrow)" />`)
  lines.push(`<text class="dimension-text" x="${bottomTextX}" y="${bottomY - 5}" text-anchor="middle">${formatDimension(params.stockWidth)}</text>`)

  // Left dimension (height)
  const leftX = tx(0) - dimOffset
  const leftY1 = ty(0)
  const leftY2 = ty(params.stockHeight)
  const leftTextY = (leftY1 + leftY2) / 2
  lines.push(`<line class="dimension" x1="${leftX}" y1="${leftY1}" x2="${leftX}" y2="${leftY2}" marker-start="url(#arrow)" marker-end="url(#arrow)" />`)
  lines.push(`<text class="dimension-text" x="${leftX + 5}" y="${leftTextY}" text-anchor="middle" transform="rotate(-90,${leftX + 5},${leftTextY})">${formatDimension(params.stockHeight)}</text>`)

  // Raster lines (first pass only for preview)
  const firstPass = toolpath.passes[0]
  if (firstPass) {
    firstPass.lines.forEach(line => {
      if (params.rasterDirection === 'x') {
        lines.push(`<line class="raster" x1="${tx(line.xStart!)}" y1="${ty(line.y!)}" x2="${tx(line.xEnd!)}" y2="${ty(line.y!)}" />`)
      } else {
        lines.push(`<line class="raster" x1="${tx(line.x!)}" y1="${ty(line.yStart!)}" x2="${tx(line.x!)}" y2="${ty(line.yEnd!)}" />`)
      }
    })

    // Start point indicator
    const startLine = firstPass.lines[0]
    if (startLine) {
      const startX = params.rasterDirection === 'x' ? startLine.xStart! : startLine.x!
      const startY = params.rasterDirection === 'x' ? startLine.y! : startLine.yStart!
      lines.push(`<circle class="start" cx="${tx(startX)}" cy="${ty(startY)}" r="5" />`)
    }
  }

  lines.push('</svg>')

  return lines.join('\n')
}
