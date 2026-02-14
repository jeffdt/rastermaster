// src/ui.ts
import type { SurfacingParams, ToolSettings } from './types'
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
          <input type="text" id="stockWidth" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?" required data-tooltip="Measure widest dimension of your stock.">
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label for="stockHeight">Height</label>
          <input type="text" id="stockHeight" inputmode="decimal" pattern="[0-9]+(\.[0-9]+)?" required data-tooltip="Measure tallest dimension of your stock.">
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label for="fudgeFactor">Fudge Factor</label>
          <div class="number-control">
            <button type="button" class="stepper-btn" data-action="decrement" tabindex="-1">−</button>
            <input type="number" id="fudgeFactor" value="0.25" step="0.25" min="0" max="10" data-tooltip="Adds margin around stock to account for measurement/placement errors. Start with 0.25&quot; - 0.5&quot;.">
            <button type="button" class="stepper-btn" data-action="increment" tabindex="-1">+</button>
          </div>
          <span class="unit">in</span>
        </div>
        <div class="form-row">
          <label>Direction</label>
          <div class="radio-group" data-tooltip="X-axis rasters horizontally, Y-axis rasters front-to-back. Cut along the grain (X for wide stock, Y for tall).">
            <label><input type="radio" name="rasterDirection" value="x" checked> X-axis</label>
            <label><input type="radio" name="rasterDirection" value="y"> Y-axis</label>
          </div>
        </div>
      </div>

      <div class="form-column form-column-hidden" aria-hidden="true">
        <h3>Job</h3>
        <div class="form-row checkbox-row">
          <input type="checkbox" id="skimPass" data-tooltip="First pass at Z=0 before depth cuts. Prevents deep initial engagement on uneven stock.">
          <label for="skimPass">Skim pass</label>
        </div>
        <div class="form-row">
          <label for="numPasses"># Passes</label>
          <div class="number-control">
            <button type="button" class="stepper-btn" data-action="decrement" tabindex="-1">−</button>
            <input type="number" id="numPasses" value="${DEFAULT_PARAMS.numPasses}" step="1" min="1" data-tooltip="Depth passes to complete the cut. Total depth = passes × depth per pass. Excludes skim pass.">
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
            <input type="number" id="pauseInterval" value="${DEFAULT_PARAMS.pauseInterval}" step="1" min="0" data-tooltip="Inserts M0 pause after every N passes. Set to 0 to disable.">
            <button type="button" class="stepper-btn" data-action="increment" tabindex="-1">+</button>
          </div>
          <span class="unit">passes</span>
        </div>
      </div>

      <div class="form-column form-column-hidden" aria-hidden="true">
        <h3>Tool</h3>
        <div class="tool-subgrid">
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

  // Initialize tooltips
  initializeTooltips(form)

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

export function resetForm(form: HTMLElement, onUpdate: (params: Partial<SurfacingParams>) => void): void {
  const setValue = (id: string, value: string) => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    if (input) input.value = value
  }

  const setChecked = (id: string, checked: boolean) => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    if (input) input.checked = checked
  }

  const setRadio = (name: string, value: string) => {
    const input = form.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement
    if (input) input.checked = true
  }

  // Clear stock dimensions (no defaults for these)
  setValue('stockWidth', '')
  setValue('stockHeight', '')

  // Reset all other fields to defaults
  setValue('fudgeFactor', DEFAULT_PARAMS.fudgeFactor.toString())
  setValue('bitDiameter', DEFAULT_PARAMS.bitDiameter.toString())
  setValue('stepoverPercent', DEFAULT_PARAMS.stepoverPercent.toString())
  setValue('numPasses', DEFAULT_PARAMS.numPasses.toString())
  setValue('depthPerPass', DEFAULT_PARAMS.depthPerPass.toString())
  setValue('pauseInterval', DEFAULT_PARAMS.pauseInterval.toString())
  setValue('feedRate', DEFAULT_PARAMS.feedRate.toString())
  setValue('plungeRate', DEFAULT_PARAMS.plungeRate.toString())
  setValue('spindleRpm', DEFAULT_PARAMS.spindleRpm.toString())
  setValue('retractHeight', DEFAULT_PARAMS.retractHeight.toString())

  setRadio('rasterDirection', DEFAULT_PARAMS.rasterDirection)
  setChecked('skimPass', DEFAULT_PARAMS.skimPass)

  // Note: We do NOT re-hide the Job/Tool columns - animation should not repeat
  // The columns stay visible after first reveal

  // Trigger update
  onUpdate(getFormValues(form))
}

export function setFormValues(form: HTMLElement, settings: Partial<ToolSettings>): void {
  const setValue = (id: string, value: string) => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    if (input) input.value = value
  }

  // Set all tool settings fields that are provided
  if (settings.bitDiameter !== undefined) {
    setValue('bitDiameter', settings.bitDiameter.toString())
  }
  if (settings.stepoverPercent !== undefined) {
    setValue('stepoverPercent', settings.stepoverPercent.toString())
  }
  if (settings.feedRate !== undefined) {
    setValue('feedRate', settings.feedRate.toString())
  }
  if (settings.plungeRate !== undefined) {
    setValue('plungeRate', settings.plungeRate.toString())
  }
  if (settings.spindleRpm !== undefined) {
    setValue('spindleRpm', settings.spindleRpm.toString())
  }
  if (settings.retractHeight !== undefined) {
    setValue('retractHeight', settings.retractHeight.toString())
  }
  if (settings.depthPerPass !== undefined) {
    setValue('depthPerPass', settings.depthPerPass.toString())
  }
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

function initializeTooltips(container: HTMLElement): void {
  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'blueprint-tooltip'
  tooltipEl.innerHTML = `
    <div class="blueprint-tooltip-leader"></div>
    <div class="blueprint-tooltip-content">
      <div class="blueprint-tooltip-corner blueprint-tooltip-corner-tl"></div>
      <div class="blueprint-tooltip-corner blueprint-tooltip-corner-tr"></div>
      <div class="blueprint-tooltip-corner blueprint-tooltip-corner-bl"></div>
      <div class="blueprint-tooltip-corner blueprint-tooltip-corner-br"></div>
      <div class="blueprint-tooltip-text"></div>
    </div>
  `
  document.body.appendChild(tooltipEl)

  let currentTarget: HTMLElement | null = null
  let showTimeout: number | null = null
  let isHovering = false

  const showTooltip = (target: HTMLElement, immediate = false) => {
    const text = target.getAttribute('data-tooltip')
    if (!text) return

    currentTarget = target
    const textEl = tooltipEl.querySelector('.blueprint-tooltip-text') as HTMLElement
    textEl.textContent = text

    const delay = immediate ? 0 : 200

    if (showTimeout) clearTimeout(showTimeout)
    showTimeout = window.setTimeout(() => {
      positionTooltip(target, tooltipEl)
      tooltipEl.classList.add('visible')
    }, delay)
  }

  const hideTooltip = () => {
    if (showTimeout) clearTimeout(showTimeout)
    tooltipEl.classList.remove('visible')
    currentTarget = null
    isHovering = false
  }

  const positionTooltip = (target: HTMLElement, tooltip: HTMLElement) => {
    const targetRect = target.getBoundingClientRect()
    const tooltipContent = tooltip.querySelector('.blueprint-tooltip-content') as HTMLElement

    // Temporarily show to measure
    tooltip.style.visibility = 'hidden'
    tooltip.style.display = 'block'
    const tooltipRect = tooltipContent.getBoundingClientRect()
    tooltip.style.visibility = ''
    tooltip.style.display = ''

    const spacing = 16
    const leaderLength = 32

    // Try to position horizontally first (left or right)
    const spaceRight = window.innerWidth - targetRect.right
    const spaceLeft = targetRect.left
    const spaceAbove = targetRect.top
    const spaceBelow = window.innerHeight - targetRect.bottom

    let top: number
    let left: number
    let position: string

    // Prefer horizontal positioning to avoid covering the input
    if (spaceRight > tooltipRect.width + spacing + leaderLength) {
      // Position to the right
      position = 'right'
      left = targetRect.right + spacing + leaderLength
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
    } else if (spaceLeft > tooltipRect.width + spacing + leaderLength) {
      // Position to the left
      position = 'left'
      left = targetRect.left - spacing - leaderLength - tooltipRect.width
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
    } else if (spaceAbove > tooltipRect.height + spacing + leaderLength) {
      // Fallback to above
      position = 'above'
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
      top = targetRect.top - spacing - leaderLength - tooltipRect.height
    } else {
      // Fallback to below
      position = 'below'
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
      top = targetRect.bottom + spacing + leaderLength
    }

    // Keep tooltip within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8))
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8))

    tooltip.setAttribute('data-position', position)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`

    // Position the leader line
    const leader = tooltip.querySelector('.blueprint-tooltip-leader') as HTMLElement

    if (position === 'right' || position === 'left') {
      // Horizontal leader - adjust length to reach the edge of the target
      const leaderY = targetRect.top + targetRect.height / 2 - top
      leader.style.top = `${leaderY}px`

      if (position === 'right') {
        const distanceToTarget = left - targetRect.right
        leader.style.left = `-${distanceToTarget}px`
        leader.style.width = `${distanceToTarget}px`
      } else {
        const distanceToTarget = targetRect.left - (left + tooltipRect.width)
        leader.style.left = `${tooltipRect.width}px`
        leader.style.width = `${distanceToTarget}px`
      }
    } else {
      // Vertical leader
      const leaderX = targetRect.left + targetRect.width / 2 - left
      leader.style.left = `${leaderX}px`
      leader.style.top = position === 'below' ? `-${leaderLength}px` : `${tooltipRect.height}px`
    }
  }

  // Event delegation for all tooltip elements
  container.addEventListener('mouseenter', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement
    if (target && !currentTarget) {
      isHovering = true
      showTooltip(target, false)
    }
  }, true)

  container.addEventListener('mouseleave', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement
    if (target && currentTarget === target) {
      isHovering = false
      // Small delay to allow moving to tooltip
      setTimeout(() => {
        if (!isHovering) hideTooltip()
      }, 50)
    }
  }, true)

  container.addEventListener('focusin', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement
    if (target) {
      showTooltip(target, true)
    }
  }, true)

  container.addEventListener('focusout', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement
    if (target && currentTarget === target) {
      // Small delay to prevent flicker when clicking inside
      setTimeout(() => {
        if (document.activeElement && !document.activeElement.hasAttribute('data-tooltip')) {
          hideTooltip()
        }
      }, 50)
    }
  }, true)

  // Update position on scroll/resize
  window.addEventListener('scroll', () => {
    if (currentTarget) positionTooltip(currentTarget, tooltipEl)
  }, true)

  window.addEventListener('resize', () => {
    if (currentTarget) positionTooltip(currentTarget, tooltipEl)
  })
}
