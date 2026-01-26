# Fudge Factor Design

## Overview

Add a fudge factor percentage to stock dimensions to account for misaligned, mismeasured, or misshapen stock. The fudge factor uniformly expands stock dimensions on all sides before toolpath calculation, ensuring complete coverage even when stock positioning is imperfect.

## Requirements

- Default to 5% fudge factor
- Range: 0-20%
- Apply uniformly to all sides
- Fudged dimensions used for toolpath layout and overhang calculations
- Preview shows both original stock and fudge zone visually

## Data Model

### Type Changes

Add `fudgeFactor` to `SurfacingParams` in `types.ts`:

```typescript
export interface SurfacingParams {
  // Stock dimensions (required, no defaults)
  stockWidth: number
  stockHeight: number
  fudgeFactor: number  // percentage (0-20), defaults to 5

  // ... rest unchanged
}
```

### Default Value

Add to `defaults.ts`:

```typescript
export const DEFAULT_PARAMS = {
  // ... existing defaults
  fudgeFactor: 5,
}
```

## Toolpath Calculation

### Strategy

In `toolpath.ts` `calculateToolpath()`, compute effective stock dimensions at function start:

```typescript
const fudgeMultiplier = 1 + (params.fudgeFactor / 100)
const effectiveWidth = params.stockWidth * fudgeMultiplier
const effectiveHeight = params.stockHeight * fudgeMultiplier
```

Replace all uses of `params.stockWidth` and `params.stockHeight` with `effectiveWidth` and `effectiveHeight` throughout the function. Existing overhang logic remains unchanged - it operates on the fudged dimensions.

### Toolpath Interface Changes

Add original stock bounds to preserve pre-fudge dimensions for preview:

```typescript
export interface Toolpath {
  passes: ZPass[]
  bounds: {  // Fudged stock bounds (before overhang)
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  originalStockBounds: {  // Original stock (before fudge)
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  params: SurfacingParams
}
```

Calculate `originalStockBounds` based on raster direction:
- X-axis raster: `{ xMin: 0, xMax: stockWidth, yMin: 0, yMax: stockHeight }`
- Y-axis raster: same coordinates

## Preview Visualization

### Rendering Strategy

In `preview.ts` `generatePreviewSVG()`, render three layers:

1. **Original stock** - filled rectangle using `originalStockBounds`, light gray fill (#e5e7eb)
2. **Fudge zone** - border area between original and fudged stock, amber/orange fill (#fbbf24)
3. **Raster lines** - unchanged, drawn over the top

### Fudge Zone Implementation

The fudge zone is the area between `originalStockBounds` and the inner portion of `bounds` (fudged stock before overhang). Render as four border strips (top, right, bottom, left) or as a path element.

Visual hierarchy:
- Original stock: solid, muted color
- Fudge zone: distinct warning color to indicate "safety margin"
- Raster lines: prominent, show actual tool travel

## UI Form

### Form Field

Add to Stock section in `ui.ts` after `stockHeight`:

```html
<div class="form-group">
  <label for="fudgeFactor">Fudge Factor (%)</label>
  <input
    type="number"
    id="fudgeFactor"
    name="fudgeFactor"
    min="0"
    max="20"
    step="0.5"
    value="5"
  />
  <span class="help-text">Expands stock dimensions to account for misalignment or measurement errors</span>
</div>
```

### Validation

In `ui.ts` `validateParams()`:
- Fudge factor must be between 0 and 20
- Must be a valid number
- No conditional visibility - always shown and active

### Behavior

- Field is always visible (not conditional)
- User can set to 0% to disable fudge
- Default 5% provides reasonable safety margin
- Changes trigger live preview update

## Testing Considerations

### Unit Tests

**toolpath.test.ts:**
- Verify effective dimensions calculation (10" stock @ 5% = 10.5" effective)
- Verify fudge applies before overhang
- Verify originalStockBounds preserved correctly
- Test edge cases: 0% fudge, 20% fudge

**preview.test.ts:**
- Verify fudge zone renders between original and fudged bounds
- Verify correct layer ordering
- Verify colors differentiate zones

**ui.test.ts:**
- Verify fudge factor validation (range 0-20)
- Verify default value (5)
- Verify form extraction includes fudgeFactor

### Manual Testing

- Visual inspection: fudge zone clearly visible in preview
- Verify GCode positions match fudged dimensions
- Test extreme values (0%, 20%)
- Test with different raster directions

## Implementation Notes

- Fudge multiplier applies to both width and height uniformly
- Original stock bounds calculated at origin (0,0) before any transformations
- Preview scaling must account for larger effective area
- GCode output reflects fudged dimensions (user sees expanded coverage area)
