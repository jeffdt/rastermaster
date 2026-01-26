// src/main.ts
import { createForm, getFormValues, isFormValid } from './ui'
import { calculateToolpath } from './toolpath'
import { generateGCode } from './gcode'
import { generatePreviewSVG } from './preview'
import { mergeWithDefaults } from './defaults'
import type { SurfacingParams } from './types'

function init() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  app.innerHTML = `
    <h1 class="title">RasterMaster</h1>
    <div class="container">
      <div id="form-container"></div>
      <div class="preview-container">
        <div id="preview"></div>
        <button class="generate-btn" id="generateBtn" disabled>Generate GCode</button>
      </div>
    </div>
  `

  const formContainer = app.querySelector('#form-container')!
  const previewContainer = app.querySelector('#preview')!
  const generateBtn = app.querySelector('#generateBtn') as HTMLButtonElement

  let currentParams: Partial<SurfacingParams> = {}

  function updatePreview() {
    if (!isFormValid(currentParams)) {
      previewContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Enter stock dimensions to see preview</p>'
      generateBtn.disabled = true
      return
    }

    const params = mergeWithDefaults(currentParams as { stockWidth: number; stockHeight: number } & Partial<SurfacingParams>)
    const toolpath = calculateToolpath(params)
    const rect = previewContainer.getBoundingClientRect()
    const svg = generatePreviewSVG(toolpath, rect.width || 500, rect.height || 375)
    previewContainer.innerHTML = svg
    generateBtn.disabled = false
  }

  const form = createForm((params) => {
    currentParams = params
    updatePreview()
  })
  formContainer.appendChild(form)

  generateBtn.addEventListener('click', () => {
    if (!isFormValid(currentParams)) return

    const params = mergeWithDefaults(currentParams as { stockWidth: number; stockHeight: number } & Partial<SurfacingParams>)
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    // Download
    const blob = new Blob([gcode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rastermaster-${params.stockWidth}x${params.stockHeight}.gcode`
    a.click()
    URL.revokeObjectURL(url)
  })

  // Initial preview
  updatePreview()
}

init()
