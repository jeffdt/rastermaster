// src/format.ts
export function formatDimension(value: number): string {
  // Round to 2 decimals
  const rounded = Math.round(value * 100) / 100

  // Check if whole number
  if (rounded % 1 === 0) {
    return `${rounded}"`
  }

  // Format with 2 decimals, then remove trailing zeros
  return `${rounded.toFixed(2).replace(/\.?0+$/, '')}"`;
}
