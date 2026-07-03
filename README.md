# RasterMaster

A single-page web application that generates GRBL-compatible GCode for CNC surfacing operations. Built specifically for the Shapeoko 5, it bundles into a single, self-contained HTML file that runs entirely offline in the browser.

**Try it now:** [rastermaster.jeffdt.com](https://rastermaster.jeffdt.com)

![TypeScript](https://img.shields.io/badge/TypeScript-Bun-3178c6?logo=typescript&logoColor=white)
![Offline](https://img.shields.io/badge/offline-single--file-1f6feb)
![License](https://img.shields.io/badge/license-MIT-green)
![Vibe coded](https://img.shields.io/badge/vibe%20coded-100%25-ff69b4)

## Why

Surfacing warped or rough wood was always one of the most common operations on my CNC, but my CAD/CAM software required way too much setup to do it. RasterMaster is a minimalist tool that does exactly one thing well: turns stock measurements into a surfacing job you can run immediately. Open the webpage, enter your stock size, grab the GCode, run the job, and toss the file when you're done. Making another takes seconds, so don't waste any time organizing project files.

## Features

- Generate raster toolpaths for surfacing operations
- Support for both X-axis and Y-axis raster directions
- Configurable parameters (bit diameter, stepover, depth per pass, etc.)
- Live toolpath preview
- Multi-pass support with optional skim pass
- Optional pauses between passes
- Completely offline (no internet required)
- Single-file HTML output

## Usage

1. Open the app (see below for options to access it)
2. Enter your stock dimensions and surfacing parameters
3. Preview the toolpath
4. Download the generated GCode

### Accessing the app

- **Online:** use it live at [rastermaster.jeffdt.com](https://rastermaster.jeffdt.com) right now. It's free and does not require an account or installation of any kind.
- **Offline:** since the app is a single self-contained HTML file, you can save it for use without an internet connection (e.g. in a workshop with no wifi access): open the live site, save the page (File > Save Page As, or Ctrl/Cmd+S), and open the saved file directly in a browser any time. All functionality works fully offline.
- **From source:** for the nerds. Only needed if you want to modify the app. Clone the repo, run `bun run build`, and open `dist/index.html` in your browser.

## Development

### Prerequisites

- [Bun](https://bun.sh) (runtime and package manager)

### Commands

- `bun install` - Install dependencies
- `bun run dev` - Start development server with hot reload
- `bun run build` - Build production bundle to `dist/index.html`
- `bun run preview` - Preview production build locally
- `bun test` - Run all tests

### Architecture

Built with:
- **Vite** with `vite-plugin-singlefile` for bundling
- **TypeScript** for type safety
- **Bun** for testing and development

## License

MIT
