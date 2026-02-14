// src/settings.ts
import type { ToolSettings, SurfacingParams } from './types'

const STORAGE_KEY = 'rastermaster-tool-settings'

/**
 * Save tool settings to localStorage
 */
export function saveToolSettings(settings: ToolSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save tool settings:', e)
  }
}

/**
 * Load tool settings from localStorage
 */
export function loadToolSettings(): ToolSettings | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const parsed = JSON.parse(saved)

    // Validate that all required fields exist and are numbers
    const requiredFields: (keyof ToolSettings)[] = [
      'bitDiameter',
      'stepoverPercent',
      'feedRate',
      'plungeRate',
      'spindleRpm',
      'retractHeight',
      'depthPerPass',
    ]

    for (const field of requiredFields) {
      if (typeof parsed[field] !== 'number') {
        return null
      }
    }

    return parsed as ToolSettings
  } catch (e) {
    console.warn('Failed to load tool settings:', e)
    return null
  }
}

/**
 * Clear saved tool settings from localStorage
 */
export function clearToolSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear tool settings:', e)
  }
}

/**
 * Export tool settings to a shareable URL hash
 */
export function exportToURL(settings: ToolSettings): string {
  const json = JSON.stringify(settings)
  const base64 = btoa(json)
  return `#tool=${base64}`
}

/**
 * Import tool settings from a URL hash
 */
export function importFromURL(url: string): ToolSettings {
  // Extract base64 from #tool= prefix
  if (!url.startsWith('#tool=')) {
    throw new Error('Invalid URL format: must start with #tool=')
  }

  const base64 = url.slice(6)
  const json = atob(base64)
  const parsed = JSON.parse(json)

  // Validate all required fields
  const requiredFields: (keyof ToolSettings)[] = [
    'bitDiameter',
    'stepoverPercent',
    'feedRate',
    'plungeRate',
    'spindleRpm',
    'retractHeight',
    'depthPerPass',
  ]

  for (const field of requiredFields) {
    if (typeof parsed[field] !== 'number') {
      throw new Error(`Invalid or missing field: ${field}`)
    }
  }

  return parsed as ToolSettings
}

/**
 * Extract only tool settings fields from params
 */
export function extractToolSettings(
  params: Partial<SurfacingParams>
): Partial<ToolSettings> {
  return {
    bitDiameter: params.bitDiameter,
    stepoverPercent: params.stepoverPercent,
    feedRate: params.feedRate,
    plungeRate: params.plungeRate,
    spindleRpm: params.spindleRpm,
    retractHeight: params.retractHeight,
    depthPerPass: params.depthPerPass,
  }
}
