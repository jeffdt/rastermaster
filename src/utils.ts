export function parseMeasurement(str: string): number {
  const trimmed = str.trim()
  if (!trimmed) return NaN

  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return parts[0].includes('/') ? parseFraction(parts[0]) : parseFloat(parts[0])
  }

  if (parts.length === 2) {
    const whole = parseFloat(parts[0])
    const frac = parseFraction(parts[1])
    if (isNaN(whole) || isNaN(frac)) return NaN
    if (whole < 0) return NaN
    return whole + frac
  }

  return NaN
}

function parseFraction(str: string): number {
  const slashParts = str.split('/')
  if (slashParts.length !== 2) return NaN
  const num = parseFloat(slashParts[0])
  const den = parseFloat(slashParts[1])
  if (isNaN(num) || isNaN(den) || den === 0) return NaN
  return num / den
}
