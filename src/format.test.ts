// src/format.test.ts
import { describe, expect, test } from 'bun:test'
import { formatDimension } from './format'

describe('formatDimension', () => {
  test('formats whole numbers without decimals', () => {
    expect(formatDimension(10)).toBe('10"')
    expect(formatDimension(8)).toBe('8"')
  })

  test('formats half-inch values with one decimal', () => {
    expect(formatDimension(10.5)).toBe('10.5"')
    expect(formatDimension(8.5)).toBe('8.5"')
  })

  test('formats fractional inches with up to 2 decimals', () => {
    expect(formatDimension(10.0625)).toBe('10.06"')
    expect(formatDimension(8.125)).toBe('8.13"')
    expect(formatDimension(10.06)).toBe('10.06"')
  })

  test('removes trailing zeros after decimal point', () => {
    expect(formatDimension(10.10)).toBe('10.1"')
    expect(formatDimension(8.20)).toBe('8.2"')
  })
})
