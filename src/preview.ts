// src/preview.ts
import type { Toolpath } from './toolpath'
import { formatDimension } from './format'

export function generatePassScheduleHTML(toolpath: Toolpath): string {
  const { passes, params } = toolpath

  if (passes.length === 0) {
    return ''
  }

  const rows = passes.map((pass, i) => {
    const rowClass = pass.type === 'skim' ? 'pass-row-skim' : 'pass-row-depth'
    const typeLabel = pass.type === 'skim' ? 'SKIM' : 'DEPTH'
    const zLabel = pass.z === 0 ? 'Z 0' : `Z ${pass.z.toFixed(4).replace(/0+$/, '').replace(/\.$/, '"')}`
    const pauseIndicator = pass.pauseAfter ? ' <span class="pass-pause-mark" title="Pause after this pass">M0</span>' : ''
    return `<tr class="pass-row ${rowClass}">
      <td class="pass-num">${i + 1}</td>
      <td class="pass-type">${typeLabel}</td>
      <td class="pass-z">${zLabel}"${pauseIndicator}</td>
    </tr>`
  }).join('\n')

  const depthTotal = params.totalDepth > 0 ? `${params.totalDepth}"` : ''
  const subtitle = depthTotal ? `${passes.length} passes &mdash; ${depthTotal} total` : `${passes.length} pass`

  return `<div class="pass-schedule">
  <div class="pass-schedule-header">
    <span class="pass-schedule-title">Pass Schedule</span>
    <span class="pass-schedule-subtitle">${subtitle}</span>
  </div>
  <table class="pass-table">
    <thead>
      <tr>
        <th>#</th>
        <th>TYPE</th>
        <th>Z DEPTH</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>`
}

export function generatePreviewSVG(toolpath: Toolpath, width: number, height: number): string {
  const { bounds, params } = toolpath
  const padding = 20

  // Get accent color from CSS variables (for dev/prod theme support)
  const accentColor = getComputedStyle(document.body).getPropertyValue('--color-accent-amber').trim() || '#f59e0b'

  // Calculate preview bounds to include fudge zone if present
  let previewBounds = { ...bounds }
  if (params.fudgeFactor > 0) {
    const fudgeAmount = params.fudgeFactor

    previewBounds.xMin = Math.min(bounds.xMin, toolpath.originalStockBounds.xMin - fudgeAmount)
    previewBounds.xMax = Math.max(bounds.xMax, toolpath.originalStockBounds.xMax + fudgeAmount)
    previewBounds.yMin = Math.min(bounds.yMin, toolpath.originalStockBounds.yMin - fudgeAmount)
    previewBounds.yMax = Math.max(bounds.yMax, toolpath.originalStockBounds.yMax + fudgeAmount)
  }

  // Calculate scale to fit preview
  const contentWidth = previewBounds.xMax - previewBounds.xMin
  const contentHeight = previewBounds.yMax - previewBounds.yMin
  const scaleX = (width - 2 * padding) / contentWidth
  const scaleY = (height - 2 * padding) / contentHeight
  const scale = Math.min(scaleX, scaleY)

  // Calculate offsets to center the preview
  const renderedWidth = contentWidth * scale
  const renderedHeight = contentHeight * scale
  const offsetX = (width - renderedWidth) / 2
  const offsetY = (height - renderedHeight) / 2

  // Transform functions (flip Y axis for SVG coordinates)
  const tx = (x: number) => offsetX + (x - previewBounds.xMin) * scale
  const ty = (y: number) => height - offsetY - (y - previewBounds.yMin) * scale

  const lines: string[] = []

  lines.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`)

  // Styles
  lines.push('<style>')
  lines.push('  .raster { stroke: #2196F3; stroke-width: 1.5; opacity: 0.7; }')
  lines.push('  .stepover { stroke: #2196F3; stroke-width: 1.5; opacity: 0.7; }')
  lines.push('  .arrow { fill: #2196F3; opacity: 0.8; }')
  lines.push('  .start { fill: #4CAF50; }')
  lines.push('  .end { fill: #F44336; }')
  lines.push('  .dimension-text { fill: #666; font-size: 14px; font-family: Arial, sans-serif; font-weight: bold; }')
  lines.push('  .dimension-halo { stroke: white; stroke-width: 4px; stroke-linejoin: round; stroke-linecap: round; fill: white; font-size: 14px; font-family: Arial, sans-serif; font-weight: bold; }')
  lines.push('</style>')

  // Original stock rectangle (gray)
  const origWidth = toolpath.originalStockBounds.xMax - toolpath.originalStockBounds.xMin
  const origHeight = toolpath.originalStockBounds.yMax - toolpath.originalStockBounds.yMin
  lines.push(`<rect fill="#e5e7eb" stroke="#8b7355" stroke-width="2" x="${tx(toolpath.originalStockBounds.xMin)}" y="${ty(toolpath.originalStockBounds.yMax)}" width="${origWidth * scale}" height="${origHeight * scale}" />`)

  // Fudge zone (amber strips) - only if fudge factor > 0
  if (params.fudgeFactor > 0) {
    const origMinX = toolpath.originalStockBounds.xMin
    const origMaxX = toolpath.originalStockBounds.xMax
    const origMinY = toolpath.originalStockBounds.yMin
    const origMaxY = toolpath.originalStockBounds.yMax
    const origWidth = origMaxX - origMinX
    const origHeight = origMaxY - origMinY

    const fudgedWidth = origWidth + (2 * params.fudgeFactor)
    const fudgedHeight = origHeight + (2 * params.fudgeFactor)
    const fudgeAmountX = params.fudgeFactor
    const fudgeAmountY = params.fudgeFactor

    // Top strip
    lines.push(`<rect fill="${accentColor}" opacity="0.2" x="${tx(origMinX - fudgeAmountX)}" y="${ty(origMaxY + fudgeAmountY)}" width="${fudgedWidth * scale}" height="${fudgeAmountY * scale}" />`)

    // Bottom strip
    lines.push(`<rect fill="${accentColor}" opacity="0.2" x="${tx(origMinX - fudgeAmountX)}" y="${ty(origMinY)}" width="${fudgedWidth * scale}" height="${fudgeAmountY * scale}" />`)

    // Left strip (vertical, excluding top/bottom corners already covered)
    lines.push(`<rect fill="${accentColor}" opacity="0.2" x="${tx(origMinX - fudgeAmountX)}" y="${ty(origMaxY)}" width="${fudgeAmountX * scale}" height="${origHeight * scale}" />`)

    // Right strip (vertical, excluding top/bottom corners already covered)
    lines.push(`<rect fill="${accentColor}" opacity="0.2" x="${tx(origMaxX)}" y="${ty(origMaxY)}" width="${fudgeAmountX * scale}" height="${origHeight * scale}" />`)

    // Dashed outline around entire fudge zone
    lines.push(`<rect fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="4,4" x="${tx(origMinX - fudgeAmountX)}" y="${ty(origMaxY + fudgeAmountY)}" width="${fudgedWidth * scale}" height="${fudgedHeight * scale}" />`)
  }


  // Raster lines with snaking visualization (first pass only for preview)
  const firstPass = toolpath.passes[0]
  if (firstPass) {
    firstPass.lines.forEach((line, index) => {
      if (params.rasterDirection === 'x') {
        const x1 = tx(line.xStart!)
        const y1 = ty(line.y!)
        const x2 = tx(line.xEnd!)
        const y2 = ty(line.y!)

        // Draw cutting line
        lines.push(`<line class="raster" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`)

        // Draw arrow at midpoint
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const arrowSize = 6
        const direction = line.direction === 'positive' ? 1 : -1
        // Triangle pointing right or left
        lines.push(`<polygon class="arrow" points="${midX + direction * arrowSize},${midY} ${midX - direction * arrowSize / 2},${midY - arrowSize / 2} ${midX - direction * arrowSize / 2},${midY + arrowSize / 2}" />`)

        // Draw stepover to next line (if not last)
        if (index < firstPass.lines.length - 1) {
          const nextLine = firstPass.lines[index + 1]
          const nextX = tx(nextLine.xStart!)
          const nextY = ty(nextLine.y!)
          lines.push(`<line class="stepover" x1="${x2}" y1="${y2}" x2="${nextX}" y2="${nextY}" />`)
        }
      } else {
        const x1 = tx(line.x!)
        const y1 = ty(line.yStart!)
        const x2 = tx(line.x!)
        const y2 = ty(line.yEnd!)

        // Draw cutting line
        lines.push(`<line class="raster" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`)

        // Draw arrow at midpoint
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const arrowSize = 6
        const direction = line.direction === 'positive' ? 1 : -1
        // Triangle pointing down or up (flipped for SVG coordinates)
        lines.push(`<polygon class="arrow" points="${midX},${midY - direction * arrowSize} ${midX - arrowSize / 2},${midY + direction * arrowSize / 2} ${midX + arrowSize / 2},${midY + direction * arrowSize / 2}" />`)

        // Draw stepover to next line (if not last)
        if (index < firstPass.lines.length - 1) {
          const nextLine = firstPass.lines[index + 1]
          const nextX = tx(nextLine.x!)
          const nextY = ty(nextLine.yStart!)
          lines.push(`<line class="stepover" x1="${x2}" y1="${y2}" x2="${nextX}" y2="${nextY}" />`)
        }
      }
    })

    // Start point indicator (green dot)
    const startLine = firstPass.lines[0]
    if (startLine) {
      const startX = params.rasterDirection === 'x' ? startLine.xStart! : startLine.x!
      const startY = params.rasterDirection === 'x' ? startLine.y! : startLine.yStart!
      lines.push(`<circle class="start" cx="${tx(startX)}" cy="${ty(startY)}" r="5" />`)
    }

    // End point indicator (red dot)
    const endLine = firstPass.lines[firstPass.lines.length - 1]
    if (endLine) {
      const endX = params.rasterDirection === 'x' ? endLine.xEnd! : endLine.x!
      const endY = params.rasterDirection === 'x' ? endLine.y! : endLine.yEnd!
      lines.push(`<circle class="end" cx="${tx(endX)}" cy="${ty(endY)}" r="5" />`)
    }
  }

  // Dimension labels (inside original stock) - Drawn last to be on top
  const stockX1 = tx(toolpath.originalStockBounds.xMin)
  const stockX2 = tx(toolpath.originalStockBounds.xMax)
  const stockY1 = ty(toolpath.originalStockBounds.yMax)  // Top of stock in SVG
  const stockY2 = ty(toolpath.originalStockBounds.yMin)  // Bottom of stock in SVG

  // Width label - centered on bottom edge
  const widthTextX = (stockX1 + stockX2) / 2
  const widthTextY = stockY2 - 10  // 10px above bottom edge
  const widthDim = formatDimension(params.stockWidth)
  // Draw halo then text
  lines.push(`<text class="dimension-halo" x="${widthTextX}" y="${widthTextY}" text-anchor="middle">${widthDim}</text>`)
  lines.push(`<text class="dimension-text" x="${widthTextX}" y="${widthTextY}" text-anchor="middle">${widthDim}</text>`)

  // Height label - centered on left edge (horizontal text)
  const heightTextX = stockX1 + 10  // 10px from left edge
  const heightTextY = (stockY1 + stockY2) / 2
  const heightDim = formatDimension(params.stockHeight)
  // Draw halo then text
  lines.push(`<text class="dimension-halo" x="${heightTextX}" y="${heightTextY}" text-anchor="start" dominant-baseline="middle">${heightDim}</text>`)
  lines.push(`<text class="dimension-text" x="${heightTextX}" y="${heightTextY}" text-anchor="start" dominant-baseline="middle">${heightDim}</text>`)

  lines.push('</svg>')

  return lines.join('\n')
}
