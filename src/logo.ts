export function createLogoMarkup(): string {
  const rasterPath = 'M-8 7H268V21H-8V35H268V49H-8'

  return `
    <div class="brand">
      <svg class="brand-raster" viewBox="0 0 260 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="brandRasterGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" class="brand-raster-stop-muted" />
            <stop offset="0.5" class="brand-raster-stop-accent" />
            <stop offset="1" class="brand-raster-stop-muted" />
          </linearGradient>
        </defs>
        <path id="brandRasterPath" class="brand-raster-path" d="${rasterPath}" pathLength="100" />
        <path class="brand-raster-scan" d="${rasterPath}" stroke-dasharray="96 1050" stroke-dashoffset="96">
          <animate attributeName="stroke-dashoffset" from="96" to="-1050" dur="5s" repeatCount="indefinite" />
        </path>
      </svg>
      <h1 class="title"><span>Raster</span><span>Master</span></h1>
    </div>
  `
}
