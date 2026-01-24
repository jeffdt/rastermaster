# Separate Raster and Stepping Overhang Design

## Problem Statement

The current overhang implementation applies the same overhang value to both X and Y axes. This causes the bit to only partially exit the stock at the extrema of the raster direction, resulting in cross-grain cutting at those points. The bit should always fully exit the stock along the raster direction, while the stepping direction can use optimized overhang based on stepover percentage.

## Solution

Calculate separate overhang values for the raster direction (direction of travel along each line) and stepping direction (perpendicular direction where lines step over).

### Overhang Formulas

**Raster direction overhang:** Always `bitDiameter/2`
- Ensures bit fully exits stock on both ends of each pass
- Eliminates cross-grain cutting at extrema

**Stepping direction overhang:** `bitDiameter/2 - stepover`
- Positions first pass optimally to cut exactly one stepover width from edge
- Minimizes wasted travel while ensuring complete coverage
- Matches current "Full" mode behavior

### Coordinate Calculations

**For X-axis raster (horizontal lines stepping in Y):**
- xMin = -bitDiameter/2 (full overhang)
- xMax = stockWidth + bitDiameter/2 (full overhang)
- yMin = -(bitDiameter/2 - stepover) (optimized overhang)
- yMax = stockHeight + (bitDiameter/2 - stepover) (optimized overhang)

**For Y-axis raster (vertical lines stepping in X):**
- xMin = -(bitDiameter/2 - stepover) (optimized overhang)
- xMax = stockWidth + (bitDiameter/2 - stepover) (optimized overhang)
- yMin = -bitDiameter/2 (full overhang)
- yMax = stockHeight + bitDiameter/2 (full overhang)

## Changes Required

### 1. Type System (src/types.ts, src/defaults.ts)

Remove overhang mode selection entirely:
- Delete `overhangMode: 'full' | 'custom'` field
- Delete `customOverhang: number` field

This simplifies the interface since the correct overhang behavior is now automatic.

### 2. Toolpath Calculation (src/toolpath.ts)

Replace single overhang calculation with direction-specific logic:

```typescript
const stepover = params.bitDiameter * (params.stepoverPercent / 100)
const bitRadius = params.bitDiameter / 2
const steppingOverhang = bitRadius - stepover

let xMin: number, xMax: number, yMin: number, yMax: number

if (params.rasterDirection === 'x') {
  // X-axis raster: lines travel in X, step in Y
  xMin = -bitRadius
  xMax = params.stockWidth + bitRadius
  yMin = -steppingOverhang
  yMax = params.stockHeight + steppingOverhang
} else {
  // Y-axis raster: lines travel in Y, step in X
  xMin = -steppingOverhang
  xMax = params.stockWidth + steppingOverhang
  yMin = -bitRadius
  yMax = stockHeight + bitRadius
}
```

### 3. User Interface (src/ui.ts)

Remove overhang section from form:
- Delete "Full" / "Custom" radio buttons
- Delete custom overhang number input
- Delete conditional visibility logic

### 4. Tests

**New tests (write first per TDD):**
- Verify X-axis raster has full X overhang, optimized Y overhang
- Verify Y-axis raster has full Y overhang, optimized X overhang
- Test with various stepover percentages
- Test edge case: 50% stepover (steppingOverhang = 0)

**Update existing tests:**
- Remove `overhangMode` and `customOverhang` from all test parameters

## Implementation Approach (TDD)

1. Write new tests for separate overhang behavior
2. Run tests, verify they fail
3. Implement new overhang calculation in toolpath.ts
4. Run tests, verify new tests pass
5. Remove overhang fields from types and defaults
6. Fix broken tests by removing overhang parameters
7. Update UI to remove overhang controls
8. Manual testing in browser

## Benefits

- **Eliminates cross-grain cutting** at raster extrema
- **Simpler interface** - no overhang mode selection needed
- **Automatic optimization** - correct behavior without user configuration
- **Maintains edge coverage** - stepping direction still optimized for complete coverage

## Files Affected

- src/types.ts
- src/defaults.ts
- src/toolpath.ts
- src/toolpath.test.ts
- src/ui.ts
- src/gcode.test.ts
- src/preview.test.ts
