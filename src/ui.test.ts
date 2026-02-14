// src/ui.test.ts (create new file)
import { describe, expect, test, beforeEach } from 'bun:test'
import { Window } from 'happy-dom'
import { updateFormVisibility, createForm, getFormValues, validateParams, setFormValues } from './ui'
import { mergeWithDefaults } from './defaults'
import type { ToolSettings } from './types'

// Set up DOM environment
let window: Window
let document: Document

beforeEach(() => {
  window = new Window()
  document = window.document
})

describe('updateFormVisibility', () => {
  test('does nothing when stock is invalid', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="0">
      <input id="stockHeight" value="10">
      <div class="form-column"></div>
      <div class="form-column form-column-hidden"></div>
      <div class="form-column form-column-hidden"></div>
    `

    updateFormVisibility(form)

    const columns = form.querySelectorAll('.form-column')
    const jobColumn = columns[1]
    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(true)
  })

  test('reveals columns when stock width and height are valid', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="10">
      <input id="stockHeight" value="12">
      <div class="form-column"></div>
      <div class="form-column form-column-hidden" aria-hidden="true"></div>
      <div class="form-column form-column-hidden" aria-hidden="true"></div>
    `

    updateFormVisibility(form)

    const columns = form.querySelectorAll('.form-column')
    const jobColumn = columns[1]
    const toolColumn = columns[2]

    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(false)
    expect(jobColumn?.classList.contains('form-column-reveal-job')).toBe(true)
    expect(toolColumn?.classList.contains('form-column-reveal-tool')).toBe(true)
  })

  test('only reveals once (one-time animation)', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="10">
      <input id="stockHeight" value="12">
      <div class="form-column"></div>
      <div class="form-column form-column-reveal-job"></div>
      <div class="form-column form-column-reveal-tool"></div>
    `

    updateFormVisibility(form)

    // Should not re-trigger animation
    const columns = form.querySelectorAll('.form-column')
    const jobColumn = columns[1]
    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(false)
  })
})

describe('createForm', () => {
  test('form includes fudgeFactor input with correct attributes', () => {
    // Use global document set up by happy-dom
    ; (global as any).document = document

    const mockOnUpdate = () => { }
    const formElement = createForm(mockOnUpdate)

    const input = formElement.querySelector<HTMLInputElement>('#fudgeFactor')
    expect(input).toBeTruthy()
    expect(input?.type).toBe('number')
    expect(input?.min).toBe('0')
    expect(input?.max).toBe('10')
    expect(input?.step).toBe('0.25')
    expect(input?.value).toBe('0.25')
  })
})

describe('getFormValues', () => {
  test('parses decimal text inputs correctly', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="text" id="stockWidth" value="12.5">
      <input type="text" id="stockHeight" value="8.25">
      <input type="number" id="fudgeFactor" value="5">
      <input type="text" id="bitDiameter" value="1.25">
      <input type="text" id="stepoverPercent" value="50">
      <input type="text" id="depthPerPass" value="0.01">
      <input type="text" id="feedRate" value="125">
      <input type="text" id="plungeRate" value="30">
      <input type="text" id="spindleRpm" value="18000">
      <input type="text" id="retractHeight" value="0.125">
      <input type="number" id="numPasses" value="3">
      <input type="number" id="pauseInterval" value="0">
      <input type="checkbox" id="skimPass">
      <input type="radio" name="rasterDirection" value="x" checked>
    `

    const values = getFormValues(form)

    expect(values.stockWidth).toBe(12.5)
    expect(values.stockHeight).toBe(8.25)
    expect(values.fudgeFactor).toBe(5)
    expect(values.bitDiameter).toBe(1.25)
    expect(values.stepoverPercent).toBe(50)
    expect(values.depthPerPass).toBe(0.01)
    expect(values.feedRate).toBe(125)
    expect(values.plungeRate).toBe(30)
    expect(values.spindleRpm).toBe(18000)
    expect(values.retractHeight).toBe(0.125)
    expect(values.numPasses).toBe(3)
    expect(values.pauseInterval).toBe(0)
  })

  test('handles invalid text input gracefully', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="text" id="stockWidth" value="abc">
      <input type="text" id="stockHeight" value="">
      <input type="number" id="fudgeFactor" value="5">
      <input type="text" id="bitDiameter" value="1.25">
      <input type="text" id="stepoverPercent" value="50">
      <input type="text" id="depthPerPass" value="0.01">
      <input type="text" id="feedRate" value="125">
      <input type="text" id="plungeRate" value="30">
      <input type="text" id="spindleRpm" value="18000">
      <input type="text" id="retractHeight" value="0.125">
      <input type="number" id="numPasses" value="3">
      <input type="number" id="pauseInterval" value="0">
      <input type="checkbox" id="skimPass">
      <input type="radio" name="rasterDirection" value="x" checked>
    `

    const values = getFormValues(form)

    expect(isNaN(values.stockWidth!)).toBe(true)
    expect(isNaN(values.stockHeight!)).toBe(true)
  })

  test('extracts fudgeFactor', () => {
    // Use global document set up by happy-dom
    ; (global as any).document = document

    const mockOnUpdate = () => { }
    const formElement = createForm(mockOnUpdate)

    const fudgeInput = formElement.querySelector<HTMLInputElement>('#fudgeFactor')
    if (fudgeInput) fudgeInput.value = '10'

    const values = getFormValues(formElement)
    expect(values.fudgeFactor).toBe(10)
  })
})

describe('validateParams', () => {
  test('validateParams rejects fudgeFactor < 0', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      fudgeFactor: -5,
    })

    const result = validateParams(params)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(e => e.toLowerCase().includes('fudge factor'))).toBe(true)
  })

  test('validateParams rejects fudgeFactor > 10', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      fudgeFactor: 11,
    })

    const result = validateParams(params)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(e => e.toLowerCase().includes('fudge factor'))).toBe(true)
  })

  test('validateParams accepts fudgeFactor between 0 and 10', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      fudgeFactor: 10,
    })

    const result = validateParams(params)
    expect(result.length).toBe(0)
  })
})

describe('setFormValues', () => {
  test('updates form inputs with tool settings', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="number" id="bitDiameter" value="">
      <input type="number" id="stepoverPercent" value="">
      <input type="number" id="feedRate" value="">
      <input type="number" id="plungeRate" value="">
      <input type="number" id="spindleRpm" value="">
      <input type="number" id="retractHeight" value="">
      <input type="number" id="depthPerPass" value="">
    `

    const settings: Partial<ToolSettings> = {
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }

    setFormValues(form, settings)

    expect((form.querySelector('#bitDiameter') as HTMLInputElement).value).toBe('1.25')
    expect((form.querySelector('#stepoverPercent') as HTMLInputElement).value).toBe('50')
    expect((form.querySelector('#feedRate') as HTMLInputElement).value).toBe('100')
    expect((form.querySelector('#plungeRate') as HTMLInputElement).value).toBe('30')
    expect((form.querySelector('#spindleRpm') as HTMLInputElement).value).toBe('18000')
    expect((form.querySelector('#retractHeight') as HTMLInputElement).value).toBe('0.1')
    expect((form.querySelector('#depthPerPass') as HTMLInputElement).value).toBe('0.02')
  })
})
