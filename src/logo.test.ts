import { describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import { createLogoMarkup } from './logo'

describe('createLogoMarkup', () => {
  test('layers a decorative raster toolpath behind the accessible wordmark', () => {
    const window = new Window()
    const container = window.document.createElement('div')
    container.innerHTML = createLogoMarkup()

    const brand = container.querySelector('.brand')
    const mark = brand?.querySelector('.brand-raster')
    const wordmark = brand?.querySelector('h1')
    const rasterPath = brand?.querySelector('#brandRasterPath')
    const scan = brand?.querySelector('.brand-raster-scan')
    const scanMotion = scan?.querySelector('animate[attributeName="stroke-dashoffset"]')

    expect(wordmark?.textContent).toBe('RasterMaster')
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
    expect(mark?.getAttribute('focusable')).toBe('false')
    expect(brand?.firstElementChild).toBe(mark)
    expect(brand?.lastElementChild).toBe(wordmark)
    expect(rasterPath?.getAttribute('d')).toBe('M-8 7H268V21H-8V35H268V49H-8')
    expect(mark?.querySelectorAll('circle').length).toBe(0)
    expect(mark?.querySelector('animateMotion')).toBeNull()
    expect(scan?.getAttribute('stroke-dasharray')).toBe('96 1050')
    expect(scanMotion?.getAttribute('from')).toBe('96')
    expect(scanMotion?.getAttribute('to')).toBe('-1050')
    expect(scanMotion?.getAttribute('dur')).toBe('5s')
  })
})
