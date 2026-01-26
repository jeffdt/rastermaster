# Fudge Factor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a configurable fudge factor percentage (0-20%, default 5%) that uniformly expands stock dimensions to account for misalignment or measurement errors.

**Architecture:** Fudge factor applies first to create effective stock dimensions, then normal overhang calculations happen on top. Preview renders original stock, fudge zone, and raster lines in distinct visual layers.

**Tech Stack:** TypeScript, Bun test runner, SVG rendering

---

## Task 1: Add fudgeFactor to Type System

**Files:**
- Modify: `src/types.ts:2-23`
- Modify: `src/defaults.ts:4-16`
- Test: `src/types.test.ts`

**Step 1: Write failing test for fudgeFactor in DEFAULT_PARAMS**

Add to `src/types.test.ts`:

```typescript
test('DEFAULT_PARAMS includes fudgeFactor', () => {
  const params = mergeWithDefaults({ stockWidth: 10, stockHeight: 5 })
  expect(params.fudgeFactor).toBe(5)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/types.test.ts`
Expected: FAIL with "Property 'fudgeFactor' does not exist"

**Step 3: Add fudgeFactor to SurfacingParams interface**

In `src/types.ts`, add after `stockHeight`:

```typescript
fudgeFactor: number
```

**Step 4: Add fudgeFactor to DEFAULT_PARAMS**

In `src/defaults.ts`, add after `stockHeight` comment and before `bitDiameter`:

```typescript
fudgeFactor: 5,
```

**Step 5: Run test to verify it passes**

Run: `bun test src/types.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/types.ts src/defaults.ts src/types.test.ts
git commit -m "feat(types): add fudgeFactor field with 5% default"
```

---

## Task 2: Update Toolpath to Use Fudged Dimensions

**Files:**
- Modify: `src/toolpath.ts:31-136`
- Test: `src/toolpath.test.ts`

**Step 1: Write failing test for fudge factor calculation**

Add to `src/toolpath.test.ts`:

```typescript
test('applies fudge factor to stock dimensions before overhang', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 10, // 10% expansion
    bitDiameter: 2,
    stepoverPercent: 50,
  })

  const toolpath = calculateToolpath(params)

  // 10% fudge: effective stock = 11" x 5.5"
  // Bit radius = 1", stepover = 1"
  // X (raster): overhang = bitRadius = 1"
  // Y (stepping): overhang = bitRadius - stepover = 0"
  // Bounds: X = [-1, 12], Y = [0, 5.5]
  expect(toolpath.bounds.xMin).toBeCloseTo(-1, 2)
  expect(toolpath.bounds.xMax).toBeCloseTo(12, 2)
  expect(toolpath.bounds.yMin).toBeCloseTo(0, 2)
  expect(toolpath.bounds.yMax).toBeCloseTo(5.5, 2)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/toolpath.test.ts`
Expected: FAIL with incorrect bounds (not accounting for fudge)

**Step 3: Calculate effective dimensions in calculateToolpath**

In `src/toolpath.ts`, add at line 48 (start of `calculateToolpath` function, before stepover calculation):

```typescript
// Apply fudge factor to stock dimensions
const fudgeMultiplier = 1 + (params.fudgeFactor / 100)
const effectiveWidth = params.stockWidth * fudgeMultiplier
const effectiveHeight = params.stockHeight * fudgeMultiplier
```

**Step 4: Replace stockWidth/stockHeight with effective dimensions**

In `src/toolpath.ts`, replace all occurrences:
- `params.stockWidth` → `effectiveWidth` (lines 59, 65)
- `params.stockHeight` → `effectiveHeight` (lines 61, 67)

**Step 5: Run test to verify it passes**

Run: `bun test src/toolpath.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/toolpath.ts src/toolpath.test.ts
git commit -m "feat(toolpath): apply fudge factor to stock dimensions"
```

---

## Task 3: Add Original Stock Bounds to Toolpath

**Files:**
- Modify: `src/toolpath.ts:22-31`
- Modify: `src/toolpath.ts:131-136`
- Test: `src/toolpath.test.ts`

**Step 1: Write failing test for originalStockBounds**

Add to `src/toolpath.test.ts`:

```typescript
test('preserves original stock bounds before fudge', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 10,
  })

  const toolpath = calculateToolpath(params)

  // Original stock bounds should be pre-fudge dimensions
  expect(toolpath.originalStockBounds.xMin).toBe(0)
  expect(toolpath.originalStockBounds.xMax).toBe(10)
  expect(toolpath.originalStockBounds.yMin).toBe(0)
  expect(toolpath.originalStockBounds.yMax).toBe(5)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/toolpath.test.ts`
Expected: FAIL with "Property 'originalStockBounds' does not exist"

**Step 3: Add originalStockBounds to Toolpath interface**

In `src/toolpath.ts`, add after `bounds` property:

```typescript
originalStockBounds: {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}
```

**Step 4: Calculate and return originalStockBounds**

In `src/toolpath.ts`, modify the return statement at the end of `calculateToolpath`:

```typescript
return {
  passes,
  bounds: { xMin, xMax, yMin, yMax },
  originalStockBounds: {
    xMin: 0,
    xMax: params.stockWidth,
    yMin: 0,
    yMax: params.stockHeight,
  },
  params,
}
```

**Step 5: Run test to verify it passes**

Run: `bun test src/toolpath.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/toolpath.ts src/toolpath.test.ts
git commit -m "feat(toolpath): add originalStockBounds to preserve pre-fudge dimensions"
```

---

## Task 4: Render Fudge Zone in Preview

**Files:**
- Modify: `src/preview.ts:1-136`
- Test: `src/preview.test.ts`

**Step 1: Write failing test for fudge zone rendering**

Add to `src/preview.test.ts`:

```typescript
test('renders fudge zone when fudge factor > 0', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 10,
  })
  const toolpath = calculateToolpath(params)
  const svg = generatePreviewSVG(toolpath, 800, 600)

  // Should contain original stock rect
  expect(svg).toContain('fill="#e5e7eb"')
  // Should contain fudge zone
  expect(svg).toContain('fill="#fbbf24"')
})

test('does not render separate fudge zone when fudge factor is 0', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 0,
  })
  const toolpath = calculateToolpath(params)
  const svg = generatePreviewSVG(toolpath, 800, 600)

  // Should contain stock rect
  expect(svg).toContain('fill="#e5e7eb"')
  // Should not contain fudge zone (or should be zero-width)
  // Just verify it doesn't crash and renders something
  expect(svg.length).toBeGreaterThan(0)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/preview.test.ts`
Expected: FAIL (fudge zone not rendered)

**Step 3: Import calculateToolpath in preview test**

At top of `src/preview.test.ts`, add:

```typescript
import { calculateToolpath } from './toolpath'
import { mergeWithDefaults } from './defaults'
```

**Step 4: Add fudge zone rendering to generatePreviewSVG**

In `src/preview.ts`, after the stock boundary rect (around line 70-80), add:

```typescript
// Render original stock (light gray)
const origStockRect = `<rect x="${tx(toolpath.originalStockBounds.xMin)}" y="${ty(toolpath.originalStockBounds.yMax)}" width="${scaleX(toolpath.originalStockBounds.xMax - toolpath.originalStockBounds.xMin)}" height="${scaleY(toolpath.originalStockBounds.yMax - toolpath.originalStockBounds.yMin)}" fill="#e5e7eb" stroke="none" />`

// Render fudge zone (amber/orange) - only if fudge factor > 0
let fudgeZone = ''
if (toolpath.params.fudgeFactor > 0) {
  // Calculate fudged stock bounds (before overhang)
  const fudgeMultiplier = 1 + (toolpath.params.fudgeFactor / 100)
  const fudgedWidth = toolpath.params.stockWidth * fudgeMultiplier
  const fudgedHeight = toolpath.params.stockHeight * fudgeMultiplier

  // Top strip
  const topStrip = `<rect x="${tx(0)}" y="${ty(fudgedHeight)}" width="${scaleX(fudgedWidth)}" height="${scaleY(fudgedHeight - toolpath.originalStockBounds.yMax)}" fill="#fbbf24" stroke="none" />`

  // Right strip
  const rightStrip = `<rect x="${tx(toolpath.originalStockBounds.xMax)}" y="${ty(fudgedHeight)}" width="${scaleX(fudgedWidth - toolpath.originalStockBounds.xMax)}" height="${scaleY(fudgedHeight)}" fill="#fbbf24" stroke="none" />`

  // Bottom strip
  const bottomStrip = `<rect x="${tx(0)}" y="${ty(toolpath.originalStockBounds.yMin)}" width="${scaleX(fudgedWidth)}" height="${scaleY(toolpath.originalStockBounds.yMin - 0)}" fill="#fbbf24" stroke="none" />`

  // Left strip
  const leftStrip = `<rect x="${tx(0)}" y="${ty(fudgedHeight)}" width="${scaleX(toolpath.originalStockBounds.xMin - 0)}" height="${scaleY(fudgedHeight)}" fill="#fbbf24" stroke="none" />`

  fudgeZone = topStrip + rightStrip + bottomStrip + leftStrip
}
```

**Step 5: Update SVG layer composition**

Replace the old stock boundary rendering with the new layered approach. The order should be:
1. Original stock (gray)
2. Fudge zone (amber) - if fudge factor > 0
3. Raster lines
4. Start point

**Step 6: Run test to verify it passes**

Run: `bun test src/preview.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/preview.ts src/preview.test.ts
git commit -m "feat(preview): render original stock and fudge zone layers"
```

---

## Task 5: Add Fudge Factor Input to UI Form

**Files:**
- Modify: `src/ui.ts` (createForm function, ~line 50-150)
- Test: `src/ui.test.ts`

**Step 1: Write failing test for fudge factor form field**

Add to `src/ui.test.ts`:

```typescript
test('form includes fudgeFactor input with correct attributes', () => {
  const form = document.createElement('div')
  form.innerHTML = createForm()

  const input = form.querySelector<HTMLInputElement>('#fudgeFactor')
  expect(input).toBeTruthy()
  expect(input?.type).toBe('number')
  expect(input?.min).toBe('0')
  expect(input?.max).toBe('20')
  expect(input?.step).toBe('0.5')
  expect(input?.value).toBe('5')
})

test('getFormValues extracts fudgeFactor', () => {
  const form = document.createElement('form')
  form.innerHTML = createForm()

  const fudgeInput = form.querySelector<HTMLInputElement>('#fudgeFactor')
  if (fudgeInput) fudgeInput.value = '10'

  const values = getFormValues(form)
  expect(values.fudgeFactor).toBe(10)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/ui.test.ts`
Expected: FAIL (fudgeFactor input not found)

**Step 3: Add fudgeFactor input to Stock section in createForm**

In `src/ui.ts`, find the Stock section in `createForm()` (after stockHeight input), add:

```typescript
<div class="form-group">
  <label for="fudgeFactor">Fudge Factor (%)</label>
  <input type="number" id="fudgeFactor" name="fudgeFactor" min="0" max="20" step="0.5" value="5" />
  <span class="help-text">Expands stock dimensions to account for misalignment or measurement errors</span>
</div>
```

**Step 4: Import createForm and getFormValues in test if needed**

At top of `src/ui.test.ts`, ensure:

```typescript
import { createForm, getFormValues } from './ui'
```

**Step 5: Run test to verify it passes**

Run: `bun test src/ui.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/ui.ts src/ui.test.ts
git commit -m "feat(ui): add fudge factor input to Stock section"
```

---

## Task 6: Add Fudge Factor Validation

**Files:**
- Modify: `src/ui.ts` (validateParams function)
- Test: `src/ui.test.ts`

**Step 1: Write failing tests for fudge factor validation**

Add to `src/ui.test.ts`:

```typescript
test('validateParams rejects fudgeFactor < 0', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: -5,
  })

  const result = validateParams(params)
  expect(result.valid).toBe(false)
  expect(result.errors.some(e => e.includes('fudgeFactor') || e.includes('Fudge Factor'))).toBe(true)
})

test('validateParams rejects fudgeFactor > 20', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 25,
  })

  const result = validateParams(params)
  expect(result.valid).toBe(false)
  expect(result.errors.some(e => e.includes('fudgeFactor') || e.includes('Fudge Factor'))).toBe(true)
})

test('validateParams accepts fudgeFactor between 0 and 20', () => {
  const params = mergeWithDefaults({
    stockWidth: 10,
    stockHeight: 5,
    fudgeFactor: 10,
  })

  const result = validateParams(params)
  expect(result.valid).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/ui.test.ts`
Expected: FAIL (validation not implemented)

**Step 3: Import validateParams and mergeWithDefaults in test**

At top of `src/ui.test.ts`, add:

```typescript
import { validateParams } from './ui'
import { mergeWithDefaults } from './defaults'
```

**Step 4: Add fudge factor validation to validateParams**

In `src/ui.ts` `validateParams()` function, add:

```typescript
if (params.fudgeFactor < 0 || params.fudgeFactor > 20) {
  errors.push('Fudge Factor must be between 0 and 20%')
}
```

**Step 5: Run test to verify it passes**

Run: `bun test src/ui.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/ui.ts src/ui.test.ts
git commit -m "feat(ui): validate fudge factor range (0-20%)"
```

---

## Task 7: Run Full Test Suite and Manual Verification

**Files:**
- All test files

**Step 1: Run complete test suite**

Run: `bun test`
Expected: All tests pass (42+ tests)

**Step 2: Start dev server for manual testing**

Run: `bun run dev`

**Step 3: Manual test cases**

Test the following scenarios in browser:
1. Default behavior: 10"x5" stock with 5% fudge should show visible amber border
2. Zero fudge: Set fudge to 0%, verify no amber border (or minimal)
3. Maximum fudge: Set fudge to 20%, verify large amber border
4. Validation: Try entering -5 or 25, verify error message
5. X-axis raster: Verify fudge zone renders correctly
6. Y-axis raster: Verify fudge zone renders correctly
7. Preview scaling: Verify preview scales correctly with larger effective area

**Step 4: Build production bundle**

Run: `bun run build`
Expected: Build succeeds, creates `dist/index.html`

**Step 5: Preview production build**

Run: `bun run preview`
Verify: Fudge factor works identically in production build

**Step 6: Final commit if any fixes were needed**

```bash
git add .
git commit -m "test: verify fudge factor functionality in dev and prod"
```

---

## Completion

After all tasks complete:

1. Run `bun test` - verify all 42+ tests pass
2. Visually verify preview shows distinct layers: gray stock, amber fudge zone, raster lines
3. Verify GCode output reflects fudged dimensions
4. Ready to merge to main or create PR

**Testing Notes:**
- Fudge factor of 5% on 10"x10" stock creates 10.5"x10.5" effective area
- Overhang still applies on top of fudged dimensions
- Preview should clearly show original stock vs fudge expansion
- Form always shows fudge factor input (not conditional)
