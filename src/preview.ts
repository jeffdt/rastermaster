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

  // Styles
  lines.push('<style>')
  lines.push('  .stock { fill: #f5f5dc; stroke: #8b7355; stroke-width: 2; }')
  lines.push('  .overhang { fill: none; stroke: #ccc; stroke-width: 1; stroke-dasharray: 4; }')
  lines.push('  .raster { stroke: #2196F3; stroke-width: 1; opacity: 0.7; }')
  lines.push('  .start { fill: #4CAF50; }')
  lines.push('  .dimension-text { fill: #666; font-size: 14px; font-family: Arial, sans-serif; }')
  lines.push('</style>')

  // Overhang area (dashed rectangle)
  lines.push(`<rect class="overhang" x="${tx(bounds.xMin)}" y="${ty(bounds.yMax)}" width="${contentWidth * scale}" height="${contentHeight * scale}" />`)

  // Stock rectangle
  lines.push(`<rect class="stock" x="${tx(0)}" y="${ty(params.stockHeight)}" width="${params.stockWidth * scale}" height="${params.stockHeight * scale}" />`)

  // Dimension labels (inside stock)
  const stockX1 = tx(0)
  const stockX2 = tx(params.stockWidth)
  const stockY1 = ty(params.stockHeight)  // Top of stock in SVG
  const stockY2 = ty(0)                   // Bottom of stock in SVG

  // Width label - centered on bottom edge
  const widthTextX = (stockX1 + stockX2) / 2
  const widthTextY = stockY2 - 10  // 10px above bottom edge
  lines.push(`<text class="dimension-text" x="${widthTextX}" y="${widthTextY}" text-anchor="middle">${formatDimension(params.stockWidth)}</text>`)

  // Height label - centered on left edge (horizontal text)
  const heightTextX = stockX1 + 10  // 10px from left edge
  const heightTextY = (stockY1 + stockY2) / 2
  lines.push(`<text class="dimension-text" x="${heightTextX}" y="${heightTextY}" text-anchor="start" dominant-baseline="middle">${formatDimension(params.stockHeight)}</text>`)

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
