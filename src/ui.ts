// src/ui.ts
import type { SurfacingParams } from './types'
import { DEFAULT_PARAMS } from './defaults'

export function createForm(onUpdate: (params: Partial<SurfacingParams>) => void): HTMLElement {
  const form = document.createElement('div')
  form.className = 'form-container'
  form.innerHTML = `
    <div class="form-grid">
      <div class="form-column">
        <h3>Stock</h3>
        <div class="form-row">
          <label for="stockWidth">Width</label>
          <input type="text" id="stockWidth" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?" required>
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label for="stockHeight">Height</label>
          <input type="text" id="stockHeight" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?" required>
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label for="fudgeFactor">Corner Fudge</label>
          <div class="number-control">
            <button type="button" class="stepper-btn" data-action="decrement" tabindex="-1">−</button>
            <input type="number" id="fudgeFactor" value="0.25" step="0.25" min="0" max="10">
            <button type="button" class="stepper-btn" data-action="increment" tabindex="-1">+</button>
          </div>
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label>Direction</label>
          <div class="radio-group">
            <label><input type="radio" name="rasterDirection" value="x" checked> X-axis</label>
            <label><input type="radio" name="rasterDirection" value="y"> Y-axis</label>
          </div>
        </div>
      </div>

      <div class="form-column form-column-hidden" aria-hidden="true">
        <h3>Job</h3>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="skimPass">
          <label for="skimPass">Skim pass</label>
        </div>
        <div class="form-row">
          <label for="numPasses"># Passes</label>
          <div class="number-control">
            <button type="button" class="stepper-btn" data-action="decrement" tabindex="-1">−</button>
            <input type="number" id="numPasses" value="${DEFAULT_PARAMS.numPasses}" step="1" min="1">
            <button type="button" class="stepper-btn" data-action="increment" tabindex="-1">+</button>
          </div>
          <span class="unit"></span>
        </div>
        <div class="form-row">
          <label for="depthPerPass">Depth per Pass</label>
          <input type="text" id="depthPerPass" value="${DEFAULT_PARAMS.depthPerPass}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label for="pauseInterval">Pause every</label>
          <div class="number-control">
            <button type="button" class="stepper-btn" data-action="decrement" tabindex="-1">−</button>
            <input type="number" id="pauseInterval" value="${DEFAULT_PARAMS.pauseInterval}" step="1" min="0">
            <button type="button" class="stepper-btn" data-action="increment" tabindex="-1">+</button>
          </div>
          <span class="unit">passes</span>
        </div>
      </div>

      <div class="form-column form-column-hidden" aria-hidden="true">
        <h3>Tool</h3>
        <div class="tool-subgrid">
          <div class="tool-subcolumn">
            <div class="form-row">
              <label for="bitDiameter">Bit Diameter</label>
              <input type="text" id="bitDiameter" value="${DEFAULT_PARAMS.bitDiameter}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">in</span>
            </div>
            <div class="form-row">
              <label for="stepoverPercent">Stepover</label>
              <input type="text" id="stepoverPercent" value="${DEFAULT_PARAMS.stepoverPercent}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">%</span>
            </div>
            <div class="form-row">
              <label for="feedRate">Feed Rate</label>
              <input type="text" id="feedRate" value="${DEFAULT_PARAMS.feedRate}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">in/min</span>
            </div>
          </div>
          <div class="tool-subcolumn">
            <div class="form-row">
              <label for="plungeRate">Plunge Rate</label>
              <input type="text" id="plungeRate" value="${DEFAULT_PARAMS.plungeRate}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">in/min</span>
            </div>
            <div class="form-row">
              <label for="spindleRpm">Spindle Speed</label>
              <input type="text" id="spindleRpm" value="${DEFAULT_PARAMS.spindleRpm}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">RPM</span>
            </div>
            <div class="form-row">
              <label for="retractHeight">Retract Height</label>
              <input type="text" id="retractHeight" value="${DEFAULT_PARAMS.retractHeight}" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?">
              <span class="unit">in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Wire up event listeners
  const inputs = form.querySelectorAll('input')
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      updateFormVisibility(form)
      onUpdate(getFormValues(form))
    })
    input.addEventListener('change', () => {
      updateFormVisibility(form)
      onUpdate(getFormValues(form))
    })
  })

  // Wire up stepper buttons
  const steppers = form.querySelectorAll('.number-control')
  steppers.forEach(stepper => {
    const input = stepper.querySelector('input[type="number"]') as HTMLInputElement
    const decrementBtn = stepper.querySelector('button[data-action="decrement"]') as HTMLButtonElement
    const incrementBtn = stepper.querySelector('button[data-action="increment"]') as HTMLButtonElement

    if (!input || !decrementBtn || !incrementBtn) return

    const updateValue = (increment: boolean) => {
      const step = parseFloat(input.step) || 1
      const min = input.min ? parseFloat(input.min) : -Infinity
      const max = input.max ? parseFloat(input.max) : Infinity
      let val = parseFloat(input.value) || 0

      if (increment) {
        val += step
      } else {
        val -= step
      }

      // Floating point correction
      val = Math.round(val * 100) / 100

      if (val < min) val = min
      if (val > max) val = max

      input.value = val.toString()
      input.dispatchEvent(new Event('input'))
      input.dispatchEvent(new Event('change'))
    }

    decrementBtn.addEventListener('click', () => updateValue(false))
    incrementBtn.addEventListener('click', () => updateValue(true))
  })

  return form
}

export function updateFormVisibility(form: HTMLElement): void {
  const getValue = (id: string): number => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    return parseFloat(input?.value || '0')
  }

  const stockWidth = getValue('stockWidth')
  const stockHeight = getValue('stockHeight')
  const isStockValid = stockWidth > 0 && stockHeight > 0

  if (!isStockValid) return

  const columns = form.querySelectorAll('.form-column')
  const jobColumn = columns[1] as HTMLElement
  const toolColumn = columns[2] as HTMLElement

  if (!jobColumn || !toolColumn) return

  // Only reveal if not already revealed (one-time animation)
  if (jobColumn.classList.contains('form-column-hidden')) {
    jobColumn.classList.remove('form-column-hidden')
    jobColumn.classList.add('form-column-reveal-job')
    jobColumn.removeAttribute('aria-hidden')

    toolColumn.classList.remove('form-column-hidden')
    toolColumn.classList.add('form-column-reveal-tool')
    toolColumn.removeAttribute('aria-hidden')

    // Clean up will-change after animations complete
    const cleanup = () => {
      if (jobColumn.style) jobColumn.style.willChange = 'auto'
      if (toolColumn.style) toolColumn.style.willChange = 'auto'
    }
    toolColumn.addEventListener('animationend', cleanup, { once: true })
  }
}

export function getFormValues(form: HTMLElement): Partial<SurfacingParams> {
  const getValue = (id: string): number => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    return parseFloat(input.value)
  }

  const getChecked = (id: string): boolean => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    return input.checked
  }

  const getRadio = (name: string): string => {
    const input = form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement
    return input?.value || ''
  }

  return {
    stockWidth: getValue('stockWidth'),
    stockHeight: getValue('stockHeight'),
    fudgeFactor: getValue('fudgeFactor'),
    bitDiameter: getValue('bitDiameter'),
    stepoverPercent: getValue('stepoverPercent'),
    rasterDirection: getRadio('rasterDirection') as 'x' | 'y',
    skimPass: getChecked('skimPass'),
    numPasses: getValue('numPasses'),
    depthPerPass: getValue('depthPerPass'),
    pauseInterval: getValue('pauseInterval'),
    feedRate: getValue('feedRate'),
    plungeRate: getValue('plungeRate'),
    spindleRpm: getValue('spindleRpm'),
    retractHeight: getValue('retractHeight'),
  }
}

export function isFormValid(params: Partial<SurfacingParams>): boolean {
  return !!(params.stockWidth && params.stockWidth > 0 &&
    params.stockHeight && params.stockHeight > 0)
}

export function validateParams(params: Partial<SurfacingParams>): string[] {
  const errors: string[] = []

  if (!params.stockWidth || params.stockWidth <= 0 || isNaN(params.stockWidth)) {
    errors.push('Stock width must be greater than 0')
  }
  if (!params.stockHeight || params.stockHeight <= 0 || isNaN(params.stockHeight)) {
    errors.push('Stock height must be greater than 0')
  }
  if (!params.bitDiameter || params.bitDiameter <= 0 || isNaN(params.bitDiameter)) {
    errors.push('Bit diameter must be greater than 0')
  }
  if (!params.stepoverPercent || params.stepoverPercent < 10 || params.stepoverPercent > 100 || isNaN(params.stepoverPercent)) {
    errors.push('Stepover must be between 10% and 100%')
  }
  if (!params.numPasses || params.numPasses < 1 || isNaN(params.numPasses)) {
    errors.push('Number of passes must be at least 1')
  }
  if (!params.depthPerPass || params.depthPerPass <= 0 || isNaN(params.depthPerPass)) {
    errors.push('Depth per pass must be greater than 0')
  }
  if (!params.feedRate || params.feedRate <= 0 || isNaN(params.feedRate)) {
    errors.push('Feed rate must be greater than 0')
  }
  if (!params.plungeRate || params.plungeRate <= 0 || isNaN(params.plungeRate)) {
    errors.push('Plunge rate must be greater than 0')
  }
  if (!params.spindleRpm || params.spindleRpm <= 0 || isNaN(params.spindleRpm)) {
    errors.push('Spindle RPM must be greater than 0')
  }
  if (!params.retractHeight || params.retractHeight <= 0 || isNaN(params.retractHeight)) {
    errors.push('Retract Height must be greater than 0')
  }

  // Pause interval validation (0 = disabled, no pauses)
  if (params.pauseInterval !== undefined && (params.pauseInterval < 0 || isNaN(params.pauseInterval))) {
    errors.push('Pause interval must be 0 or greater (0 = disabled)')
  }

  // Fudge factor validation (margin in inches)
  if (params.fudgeFactor !== undefined && (params.fudgeFactor < 0 || params.fudgeFactor > 10)) {
    errors.push('Fudge factor must be between 0 and 10 inches')
  }

  return errors
}
