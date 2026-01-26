// src/ui.test.ts (create new file)
import { describe, expect, test, beforeEach } from 'bun:test'
import { Window } from 'happy-dom'
import { updateFormVisibility, getFormValues } from './ui'

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

describe('getFormValues', () => {
  test('parses decimal text inputs correctly', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="text" id="stockWidth" value="12.5">
      <input type="text" id="stockHeight" value="8.25">
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
})
