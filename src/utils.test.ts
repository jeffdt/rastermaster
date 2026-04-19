import { describe, expect, test } from 'bun:test'
import { parseMeasurement } from './utils'

describe('parseMeasurement', () => {
  test('parses plain decimal', () => {
    expect(parseMeasurement('10.625')).toBe(10.625)
  })

  test('parses whole number', () => {
    expect(parseMeasurement('10')).toBe(10)
  })

  test('parses fraction only', () => {
    expect(parseMeasurement('5/8')).toBe(0.625)
  })

  test('parses whole number plus fraction', () => {
    expect(parseMeasurement('10 5/8')).toBe(10.625)
  })

  test('returns NaN for empty string', () => {
    expect(isNaN(parseMeasurement(''))).toBe(true)
  })

  test('returns NaN for non-numeric input', () => {
    expect(isNaN(parseMeasurement('abc'))).toBe(true)
  })

  test('returns NaN for division by zero', () => {
    expect(isNaN(parseMeasurement('10 0/0'))).toBe(true)
  })

  test('returns NaN for malformed fraction', () => {
    expect(isNaN(parseMeasurement('1/2/3'))).toBe(true)
  })

  test('tolerates surrounding whitespace', () => {
    expect(parseMeasurement('  10 5/8  ')).toBe(10.625)
  })

  test('parses 1/4', () => {
    expect(parseMeasurement('1/4')).toBe(0.25)
  })

  test('parses 1 1/4', () => {
    expect(parseMeasurement('1 1/4')).toBe(1.25)
  })

  test('tolerates multiple spaces between whole and fraction', () => {
    expect(parseMeasurement('10  5/8')).toBe(10.625)
  })

  test('returns NaN for negative mixed number', () => {
    expect(isNaN(parseMeasurement('-1 1/2'))).toBe(true)
  })
})
