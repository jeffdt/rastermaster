# Remove Numeric Spinner Buttons - Design

**Date:** 2026-01-26
**Status:** Approved

## Problem

Numeric input spinner buttons (up/down arrows) are not useful for most fields in the surfacing form. The step increments are arbitrary and often too small or too large to be practical compared to just typing values directly.

## Solution

Split numeric inputs into two categories based on whether steppers provide value:

### Integer Steppers (Keep Spinners)
Fields where incrementing by whole numbers makes sense:
- **# Passes** - incrementing by 1 is natural
- **Pause every** - incrementing by 1 is natural

These remain `type="number"` with visible browser spinner buttons.

### Decimal Text Fields (Remove Spinners)
All other numeric fields where users type specific measured or calculated values:
- Stock dimensions (stockWidth, stockHeight)
- Tool settings (bitDiameter, stepoverPercent, feedRate, plungeRate, spindleRpm, safeZ)
- Job settings (depthPerPass)

These convert to `type="text"` with:
- `inputmode="decimal"` - shows numeric keyboard on mobile devices
- `pattern="[0-9]*\.?[0-9]*"` - basic client-side validation for decimal numbers
- No step/min/max attributes (these only apply to number inputs)

This removes spinner buttons AND keyboard/scroll increment behavior entirely.

## Implementation

### Changes to `createForm()` (ui.ts)

**Keep as `type="number"`:**
- Line 39: `numPasses`
- Line 49: `pauseInterval`

**Convert to text with decimal inputmode:**
- Lines 14, 19: `stockWidth`, `stockHeight`
- Lines 44: `depthPerPass`
- Lines 60, 65, 70: `bitDiameter`, `stepoverPercent`, `feedRate`
- Lines 77, 82, 87: `plungeRate`, `spindleRpm`, `safeZ`

Template for converted fields:
```html
<input type="text" id="stockWidth" inputmode="decimal" pattern="[0-9]*\.?[0-9]*" required>
```

### No Changes Needed

**`getFormValues()`:** Already uses `parseFloat()`, handles text inputs correctly.

**`validateParams()`:** Already uses `isNaN()` checks, properly validates text input. Pattern attribute provides client-side feedback, but JavaScript validation is the real gatekeeper.

## Testing

### Unit Tests (ui.test.ts)
- `getFormValues()` correctly parses decimal text inputs
- `validateParams()` rejects invalid text (empty, non-numeric, out of range)
- Integer fields still work with number type

### Manual Testing
- No spinners appear on decimal fields
- Arrow keys/scroll don't increment decimal fields
- Mobile keyboard shows decimal pad (inputmode="decimal")
- Spinners still work on # Passes and Pause every
- Edge cases: empty input, text like "abc", negative numbers

### Browser Compatibility
- `inputmode="decimal"` well-supported (iOS Safari 12.2+, Chrome 66+)
- Pattern attribute is universal
- No browser-specific issues expected
