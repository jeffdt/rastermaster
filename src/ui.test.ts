// src/ui.test.ts (create new file)
import { describe, expect, test, beforeEach } from 'bun:test'
import { Window } from 'happy-dom'
import { updateFormVisibility } from './ui'

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
