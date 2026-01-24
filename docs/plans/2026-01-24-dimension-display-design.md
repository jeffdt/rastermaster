# Dimension Display Design

## Overview

Add dimension labels to the SVG preview that show the stock width and height. Labels appear on the bottom edge (width) and left edge (height) using architectural-style dimension lines positioned outside the stock boundary.

## Visual Style

- **Dimension lines**: Thin gray lines (`stroke: #999` or similar) positioned ~0.5-1cm outside the stock rectangle
- **Arrows**: Small arrow heads at each end of the dimension line pointing to the stock edges
- **Text labels**: Gray text matching the line color, centered on the dimension line
- **Format**: Integer when whole (e.g., `10"`), otherwise up to 2 decimal places with trailing zeros trimmed (e.g., `10.5"`, `10.06"`)

## Positioning

- **Bottom edge**: Horizontal dimension line below the stock showing width
- **Left edge**: Vertical dimension line to the left of the stock showing height
- **Origin alignment**: Matches the lower-left origin of the stock coordinate system

The dimensions show actual stock size only, not the extended toolpath bounds that include overhang.

## Implementation Approach

**Module**: Modifications to `src/preview.ts`

The dimension rendering will be added to the existing `generatePreviewSVG()` function. After the current preview elements (stock boundary, toolpath lines, start point), we'll add dimension line groups.

**Calculation approach**:
1. Get stock dimensions from `params.stockWidth` and `params.stockLength`
2. Calculate offset distance for dimension lines (convert 0.5-1cm to SVG units based on current scale)
3. For bottom dimension: draw horizontal line below stock with arrows, add centered text
4. For left dimension: draw vertical line left of stock with arrows, add centered text

**Number formatting**:
```typescript
function formatDimension(value: number): string {
  // Round to 2 decimals, then remove trailing zeros
  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0
    ? `${rounded}"`
    : `${rounded.toFixed(2).replace(/\.?0+$/, '')}"`;
}
```

**SVG coordinate considerations**:
- Remember Y-axis is flipped in SVG (already handled in current preview)
- Dimension lines sit outside the stock bounds in scaled coordinates
- Text rotation needed for left edge (vertical text reading bottom-to-top)

## SVG Structure

**Dimension line components** (for each edge):

1. **Arrow markers**: Define reusable SVG `<marker>` elements for arrow heads
   - Small triangular arrow pointing toward stock edge
   - Gray fill to match dimension line color
   - Added to `<defs>` section of SVG

2. **Dimension line**: Single `<line>` element with arrows at both ends
   - Uses `marker-start` and `marker-end` to reference arrow markers
   - Positioned at calculated offset from stock boundary

3. **Text label**: `<text>` element centered on dimension line
   - For bottom (horizontal): standard text orientation
   - For left (vertical): rotated 90° counter-clockwise, reading bottom-to-top
   - Positioned using `x`, `y`, and optional `transform` attributes

**Example SVG output** (simplified):
```svg
<defs>
  <marker id="arrow" viewBox="0 0 10 10" markerWidth="6" markerHeight="6">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>
  </marker>
</defs>

<!-- Bottom dimension (width) -->
<line x1="..." y1="..." x2="..." y2="..." stroke="#999" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="..." y="..." fill="#999" text-anchor="middle">10.5"</text>

<!-- Left dimension (height) -->
<line x1="..." y1="..." x2="..." y2="..." stroke="#999" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="..." y="..." fill="#999" text-anchor="middle" transform="rotate(-90,x,y)">8"</text>
```

## Testing & Edge Cases

**Test cases to add** (in `src/preview.test.ts` or new test file):

1. **Whole number dimensions**: Stock 10" × 8" displays as `10"` and `8"`
2. **Half-inch dimensions**: Stock 10.5" × 8.5" displays as `10.5"` and `8.5"`
3. **Fractional inches (16ths)**: Stock 10.0625" × 8.125" displays as `10.06"` and `8.13"`
4. **Very small stock**: Dimensions still readable and properly positioned
5. **Very large stock**: Dimension lines scale appropriately with preview
6. **SVG generation**: Verify valid SVG markup with proper marker definitions

**Edge cases to handle**:

- **Auto-scaling interaction**: Dimension lines must scale with the existing auto-scale logic that fits the preview to container
- **Padding considerations**: Current preview has padding around content; dimension lines sit between stock boundary and padding edge
- **Text overlap prevention**: Ensure dimension text doesn't overlap with stock or toolpath (offset should prevent this)
- **Arrow sizing**: Arrows should be proportional and visible at various zoom levels

**Manual verification**:
- Visual check in browser that dimensions are readable at typical screen sizes
- Verify dimension accuracy matches input values
- Confirm arrows point correctly toward stock edges
