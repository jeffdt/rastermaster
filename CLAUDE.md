# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RasterMaster is a single-page web application that generates GRBL-compatible GCode for CNC surfacing operations (specifically for a Shapeoko 5). It bundles into a single, self-contained HTML file that runs entirely offline in the browser.

## Commands

### Development
- `bun run dev` - Start Vite dev server with hot reload
- `bun run build` - Build production bundle to `dist/index.html` (single file)
- `bun run preview` - Preview production build locally

### Testing
- `bun test` - Run all tests
- `bun test <file>` - Run specific test file
- Tests use Bun's built-in test runner (`bun:test`)

## Architecture

### Build System
- **Vite** with `vite-plugin-singlefile` - bundles everything (HTML, CSS, JS) into a single `dist/index.html`
- **No runtime dependencies** - the output file works completely offline
- All CSS is embedded in `index.html` as `<style>` tags
- All TypeScript is compiled and inlined as JavaScript

### Data Flow Pipeline

The app follows a unidirectional data flow:

```
User Input (UI Form)
  ↓
SurfacingParams (types.ts)
  ↓
Toolpath Calculation (toolpath.ts)
  ↓
├─→ SVG Preview (preview.ts) → Display
└─→ GCode Generation (gcode.ts) → Download
```

### Core Modules

**types.ts** - Central type definitions
- `SurfacingParams`: All parameters for surfacing operation
- `PartialParams`: Params with only stock dimensions required

**defaults.ts** - Default parameter values
- `DEFAULT_PARAMS`: Defaults for all optional parameters (1.25" bit, 50% stepover, 18000 RPM, etc.)
- `mergeWithDefaults()`: Merges user input with defaults

**toolpath.ts** - Toolpath calculation engine
- `calculateToolpath()`: Generates raster toolpath from parameters
- Supports both X-axis and Y-axis raster directions
- Handles overhang (positions bit center to ensure proper coverage at stock edges)
- Generates multi-pass toolpaths with skim pass support
- Calculates pause points between passes (M0 commands)

**gcode.ts** - GCode generator
- `generateGCode()`: Converts toolpath to GRBL-compatible GCode
- Outputs standard CNC commands (G90, G20, M3, G0, G1, M5, M30)
- Handles both X-axis and Y-axis raster patterns
- Inserts M0 pause commands based on pause interval settings

**preview.ts** - SVG preview renderer
- `generatePreviewSVG()`: Renders toolpath as SVG
- Auto-scales to fit container with padding
- Flips Y-axis for correct SVG coordinate system
- Shows stock boundary, overhang area, raster lines, and start point

**ui.ts** - UI form generator
- `createForm()`: Generates HTML form with all parameter inputs
- `getFormValues()`: Extracts form values into Partial<SurfacingParams>
- `isFormValid()`: Quick validation for required fields
- `validateParams()`: Detailed validation with error messages
- Handles conditional field visibility (custom overhang, pause interval)

**main.ts** - Application entry point
- Initializes UI
- Wires up live preview updates
- Handles GCode download via Blob URL

### Key Concepts

**Raster Direction**: Lines can run along X-axis (stepping over in Y) or Y-axis (stepping over in X)

**Overhang**: Tool extends beyond stock edges to ensure full coverage
- "Full" mode: overhang = `bitDiameter/2 - stepover`, ensuring the first pass cuts exactly one stepover's worth of material from the stock edge
  - At 50% stepover: overhang = 0 (bit center at stock edge)
  - At 25% stepover: overhang > 0 (bit center outside stock)
  - At 75% stepover: overhang < 0 (bit center inside stock)
  - All cases result in proper edge coverage with minimal wasted travel
- "Custom" mode: bit center positioned at custom distance from stock edge

**Skim Pass**: Optional Z=0 pass before regular depth passes (for verifying flatness)

**Multi-pass**: Supports multiple Z-depth passes with configurable depth per pass

**Pause Between Passes**: Inserts M0 commands to pause machine after every N passes

## Default to Bun

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads .env files

## Testing Conventions

- Test files are co-located with source files: `*.test.ts`
- Import from `bun:test`: `import { describe, expect, test } from 'bun:test'`
- Follow TDD for new features (write test first, verify it fails, implement, verify it passes)
- All previous tests must continue passing when adding new functionality
