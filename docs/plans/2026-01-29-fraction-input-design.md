# Fraction Input Design

## Overview

Allow users to enter measurements as fractions (e.g., `1 3/4`, `15/16`) in addition to decimals, matching how they actually measure with tape measures.

**Scope:** Stock dimensions (width/height) initially, with architecture supporting easy expansion to other measurement inputs later.

## Architecture & Parsing Strategy

### Core Parsing Function

```typescript
parseMeasurement(input: string): number | null
```

Reusable function that handles all parsing logic:
- Try to parse as decimal first: `parseFloat("1.75")` → `1.75`
- If that fails or looks like a fraction, try fraction parsing
- Return `null` if invalid

### Fraction Parsing

**Regex pattern:** `^\s*(\d+)?\s*(\d+)\s*/\s*(\d+)\s*$`
- Captures optional whole number, numerator, denominator
- Handles `3/4`, `1 3/4`, `15/16` with flexible whitespace

**Denominator validation:**
- Allowed denominators: `[2, 4, 8, 16, 32]` (matches tape measure markings)
- Reject fractions like `1/3` or `5/7` as invalid

**Calculation:** `whole + (numerator / denominator)`

**Reusability:** Pure function (string → number), no DOM dependencies, can be applied to any input field later.

## Validation & Error Handling

### Validation Timing
- On blur (when user leaves field)
- On form submission
- NOT while typing (too aggressive)

### Error State Management
When `parseMeasurement()` returns `null`:
- Add `.has-error` class to input field
- Show exclamation icon inside field (positioned right)
- Store error message for tooltip
- Clear error state when valid input entered

### Error Messages
- "Invalid format - use decimals or fractions like 1 3/4"
- Single message covers all invalid cases

### Visual Implementation
- Icon positioned absolute inside input (right side)
- Custom `.has-error` class (can't use `:invalid` pseudo-class with type="text")
- Tooltip on hover shows error message

## UI Implementation

### Current Structure
```html
<div class="form-row">
  <label for="stockWidth">Width</label>
  <input type="text" id="stockWidth" ...>
  <span class="unit">in</span>
</div>
```

### Enhanced Structure
```html
<div class="form-row">
  <label for="stockWidth">Width</label>
  <div class="input-wrapper">
    <input type="text" id="stockWidth" ...>
    <span class="error-icon" title="Invalid format...">⚠️</span>
  </div>
  <span class="unit">in</span>
</div>
```

### CSS Changes
- `.input-wrapper` uses relative positioning
- `.error-icon` positioned absolute, hidden by default
- `.has-error` class on input shows icon
- Icon appears in input's right padding area
- Tooltip via `title` attribute (no JS needed)

### Pattern Attribute
Update to accept fractions:
```
pattern="[0-9]+(\.[0-9]+)?|[0-9]*\s*[0-9]+\s*/\s*[0-9]+"
```

## Integration & Data Flow

### Parsing Integration

In `getFormValues()` (ui.ts):
```typescript
// Before:
stockWidth: parseFloat(stockWidthInput.value)

// After:
stockWidth: parseMeasurement(stockWidthInput.value)
```

### Validation Flow
1. User types in field
2. On blur: run `parseMeasurement()`, show/hide error icon
3. On "Generate GCode": `validateParams()` checks for nulls
4. If any measurement is null, prevent generation and highlight errors

### Live Preview Updates
- Parse on every input event (for live preview)
- If parse fails, keep last valid preview
- Show error icon only on blur (not while typing)

### Reusable Validation Helper
```typescript
function validateMeasurementInput(inputElement: HTMLInputElement): boolean {
  const value = parseMeasurement(inputElement.value);
  if (value === null) {
    inputElement.classList.add('has-error');
    return false;
  }
  inputElement.classList.remove('has-error');
  return true;
}
```

Can be attached to any measurement input later.

## Testing Strategy

### New Test File
`src/parseMeasurement.test.ts`

### Test Cases

**Decimals:**
- `"1.75"` → `1.75`
- `"0.5"` → `0.5`

**Simple fractions:**
- `"3/4"` → `0.75`
- `"15/16"` → `0.9375`

**Mixed numbers:**
- `"1 3/4"` → `1.75`
- `"2 1/2"` → `2.5`

**Whitespace variations:**
- `"1  3/4"`, `" 3 / 4 "`

**Invalid denominators:**
- `"1/3"` → `null`
- `"5/7"` → `null`

**Invalid formats:**
- `"abc"` → `null`
- `"1/2/3"` → `null`
- `""` → `null`

**Edge cases:**
- `"0"` → `0`
- `"1/"` → `null`
- `"/4"` → `null`

### UI Tests
Extend `ui.test.ts`:
- Test `getFormValues()` with fraction inputs
- Verify error states set/cleared correctly
- Test validation helper function

### TDD Approach
Write tests first, verify they fail, implement to make them pass.

## Implementation Order

1. Create `parseMeasurement()` function with tests
2. Add UI wrapper structure and CSS for error icons
3. Integrate parsing into `getFormValues()`
4. Add validation and error display logic
5. Update pattern attributes
6. Test end-to-end with live preview
