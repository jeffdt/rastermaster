# RasterMaster

A single-page web application that generates GRBL-compatible GCode for CNC surfacing operations. Built specifically for the Shapeoko 5, it bundles into a single, self-contained HTML file that runs entirely offline in the browser.

## Features

- Generate raster toolpaths for surfacing operations
- Support for both X-axis and Y-axis raster directions
- Configurable parameters (bit diameter, stepover, depth per pass, etc.)
- Live SVG preview of toolpath
- Multi-pass support with optional skim pass
- Configurable pause intervals between passes
- Completely offline (no internet required)
- Single-file HTML output

## Usage

1. Build the project: `bun run build`
2. Open `dist/index.html` in your browser
3. Enter your stock dimensions and surfacing parameters
4. Preview the toolpath
5. Download the generated GCode

## Development

### Prerequisites

- [Bun](https://bun.sh) (runtime and package manager)

### Commands

- `bun install` - Install dependencies
- `bun run dev` - Start development server with hot reload
- `bun run build` - Build production bundle to `dist/index.html`
- `bun run preview` - Preview production build locally
- `bun test` - Run all tests

## Architecture

The app follows a unidirectional data flow:

```
User Input → SurfacingParams → Toolpath Calculation → SVG Preview + GCode Generation
```

Built with:
- **Vite** with `vite-plugin-singlefile` for bundling
- **TypeScript** for type safety
- **Bun** for testing and development

## License

MIT
