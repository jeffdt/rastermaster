// src/settings.test.ts
import { describe, expect, test, beforeEach } from 'bun:test'
import {
  saveToolSettings,
  loadToolSettings,
  clearToolSettings,
  exportToURL,
  importFromURL,
  extractToolSettings,
} from './settings'
import type { ToolSettings, SurfacingParams } from './types'

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('save then load returns settings', () => {
    const settings: ToolSettings = {
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }

    saveToolSettings(settings)
    const loaded = loadToolSettings()

    expect(loaded).toEqual(settings)
  })

  test('load returns null when no settings saved', () => {
    const loaded = loadToolSettings()
    expect(loaded).toBeNull()
  })

  test('clearToolSettings removes saved data', () => {
    const settings: ToolSettings = {
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }

    saveToolSettings(settings)
    expect(loadToolSettings()).toEqual(settings)

    clearToolSettings()
    expect(loadToolSettings()).toBeNull()
  })

  test('exportToURL produces #tool= URL format', () => {
    const settings: ToolSettings = {
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }

    const url = exportToURL(settings)

    expect(url).toStartWith('#tool=')
    // Should be base64-encoded JSON
    const base64 = url.slice(6) // Remove '#tool='
    const decoded = JSON.parse(atob(base64))
    expect(decoded).toEqual(settings)
  })

  test('importFromURL decodes valid URL', () => {
    const settings: ToolSettings = {
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }

    const url = exportToURL(settings)
    const imported = importFromURL(url)

    expect(imported).toEqual(settings)
  })

  test('importFromURL throws on invalid base64', () => {
    expect(() => importFromURL('#tool=invalid!!!')).toThrow()
  })

  test('importFromURL throws on invalid JSON', () => {
    const invalidJson = btoa('not json')
    expect(() => importFromURL(`#tool=${invalidJson}`)).toThrow()
  })

  test('importFromURL throws on missing fields', () => {
    const incomplete = { bitDiameter: 1.25 }
    const base64 = btoa(JSON.stringify(incomplete))
    expect(() => importFromURL(`#tool=${base64}`)).toThrow()
  })

  test('importFromURL throws on invalid field types', () => {
    const invalidTypes = {
      bitDiameter: '1.25', // should be number
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    }
    const base64 = btoa(JSON.stringify(invalidTypes))
    expect(() => importFromURL(`#tool=${base64}`)).toThrow()
  })

  test('extractToolSettings picks only tool fields from params', () => {
    const params: Partial<SurfacingParams> = {
      // Tool fields (should be extracted)
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
      // Non-tool fields (should be excluded)
      stockWidth: 10,
      stockHeight: 8,
      fudgeFactor: 0.5,
      rasterDirection: 'x',
      skimPass: true,
      totalDepth: 0.1,
      pauseInterval: 2,
    }

    const extracted = extractToolSettings(params)

    expect(extracted).toEqual({
      bitDiameter: 1.25,
      stepoverPercent: 50,
      feedRate: 100,
      plungeRate: 30,
      spindleRpm: 18000,
      retractHeight: 0.1,
      depthPerPass: 0.02,
    })
  })
})
