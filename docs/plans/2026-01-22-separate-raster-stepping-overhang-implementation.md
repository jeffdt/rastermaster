# Separate Raster and Stepping Overhang Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate overhang calculation for raster direction (always bitDiameter/2) and stepping direction (bitDiameter/2 - stepover) to eliminate cross-grain cutting at extrema.

**Architecture:** Update `calculateToolpath()` to compute direction-specific overhang values based on rasterDirection. Remove overhangMode and customOverhang from type system and UI.

**Tech Stack:** TypeScript, Bun test runner, vanilla DOM

---

### Task 1: Add Tests for Separate X/Y Overhang (TDD)

**Files:**
- Modify: `src/toolpath.test.ts`

**Step 1: Write test for X-axis raster with separate overhang**

Add to `src/toolpath.test.ts` after the existing describe blocks:

```typescript
describe('separate raster and stepping overhang', () => {
  test('X-axis raster has full X overhang, optimized Y overhang', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 50,
      overhangMode: 'full',
      rasterDirection: 'x',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = params.bitDiameter / 2 // 0.625
    const stepover = params.bitDiameter * (params.stepoverPercent / 100) // 0.625
    const steppingOverhang = bitRadius - stepover // 0

    // X direction (raster): full overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-bitRadius, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(params.stockWidth + bitRadius, 2)

    // Y direction (stepping): optimized overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-steppingOverhang, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(params.stockHeight + steppingOverhang, 2)
  })

  test('Y-axis raster has full Y overhang, optimized X overhang', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 50,
      overhangMode: 'full',
      rasterDirection: 'y',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = params.bitDiameter / 2 // 0.625
    const stepover = params.bitDiameter * (params.stepoverPercent / 100) // 0.625
    const steppingOverhang = bitRadius - stepover // 0

    // X direction (stepping): optimized overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-steppingOverhang, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(params.stockWidth + steppingOverhang, 2)

    // Y direction (raster): full overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-bitRadius, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(params.stockHeight + bitRadius, 2)
  })

  test('X-axis raster with 25% stepover has correct overhangs', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 1.25,
      stepoverPercent: 25,
      overhangMode: 'full',
      rasterDirection: 'x',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = 0.625
    const stepover = 1.25 * 0.25 // 0.3125
    const steppingOverhang = bitRadius - stepover // 0.3125

    // X: full overhang
    expect(toolpath.bounds.xMin).toBeCloseTo(-0.625, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(10.625, 2)

    // Y: optimized overhang (larger because stepover is smaller)
    expect(toolpath.bounds.yMin).toBeCloseTo(-0.3125, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(5.3125, 2)
  })

  test('Y-axis raster with 75% stepover has correct overhangs', () => {
    const params = mergeWithDefaults({
      stockWidth: 10,
      stockHeight: 5,
      bitDiameter: 2,
      stepoverPercent: 75,
      overhangMode: 'full',
      rasterDirection: 'y',
    })

    const toolpath = calculateToolpath(params)

    const bitRadius = 1
    const stepover = 2 * 0.75 // 1.5
    const steppingOverhang = bitRadius - stepover // -0.5 (negative!)

    // X: optimized overhang (negative means bit starts inside stock)
    expect(toolpath.bounds.xMin).toBeCloseTo(0.5, 2)
    expect(toolpath.bounds.xMax).toBeCloseTo(9.5, 2)

    // Y: full overhang
    expect(toolpath.bounds.yMin).toBeCloseTo(-1, 2)
    expect(toolpath.bounds.yMax).toBeCloseTo(6, 2)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/toolpath.test.ts`

Expected: 4 new tests FAIL because current implementation uses same overhang for both X and Y

**Step 3: Commit failing tests**

```bash
git add src/toolpath.test.ts
git commit -m "test: add failing tests for separate raster/stepping overhang"
```

---

### Task 2: Implement Separate Overhang Calculation

**Files:**
- Modify: `src/toolpath.ts:47-58`

**Step 1: Replace overhang calculation with direction-specific logic**

In `src/toolpath.ts`, replace lines 47-58 with:

```typescript
export function calculateToolpath(params: SurfacingParams): Toolpath {
  const stepover = params.bitDiameter * (params.stepoverPercent / 100)
  const bitRadius = params.bitDiameter / 2
  const steppingOverhang = params.overhangMode === 'full'
    ? bitRadius - stepover
    : params.customOverhang

  // Calculate bounds with direction-specific overhang
  let xMin: number, xMax: number, yMin: number, yMax: number

  if (params.rasterDirection === 'x') {
    // X-axis raster: lines travel in X (full overhang), step in Y (optimized)
    xMin = -bitRadius
    xMax = params.stockWidth + bitRadius
    yMin = -steppingOverhang
    yMax = params.stockHeight + steppingOverhang
  } else {
    // Y-axis raster: lines travel in Y (full overhang), step in X (optimized)
    xMin = -steppingOverhang
    xMax = params.stockWidth + steppingOverhang
    yMin = -bitRadius
    yMax = params.stockHeight + bitRadius
  }
```

**Step 2: Update comment block above function**

Replace lines 33-46 with:

```typescript
/**
 * Calculates the toolpath for a CNC surfacing operation.
 *
 * Overhang Logic:
 * - Raster direction (along line travel): Always bitDiameter/2
 *   - Ensures bit fully exits stock on both ends of each pass
 *   - Eliminates cross-grain cutting at extrema
 * - Stepping direction (perpendicular): bitDiameter/2 - stepover (Full mode) or customOverhang
 *   - Positions first pass optimally to cut exactly one stepover width from edge
 *   - Minimizes wasted travel while ensuring complete coverage
 *
 * Examples (X-axis raster with 1.25" bit @ 50% stepover):
 *   - X bounds: [-0.625, stockWidth + 0.625] (full overhang)
 *   - Y bounds: [0, stockHeight] (optimized overhang = 0.625 - 0.625 = 0)
 */
```

**Step 3: Run tests to verify new tests pass**

Run: `bun test src/toolpath.test.ts`

Expected: All 4 new tests PASS, but some old tests may now fail (those checking bounds)

**Step 4: Commit implementation**

```bash
git add src/toolpath.ts
git commit -m "feat: implement separate raster and stepping overhang"
```

---

### Task 3: Remove Overhang Fields from Type System

**Files:**
- Modify: `src/types.ts:10-11`
- Modify: `src/defaults.ts:7-8`

**Step 1: Remove overhang fields from SurfacingParams**

In `src/types.ts`, delete lines 10-11:

```typescript
// DELETE THESE LINES:
  overhangMode: 'full' | 'custom'
  customOverhang: number
```

**Step 2: Remove overhang fields from DEFAULT_PARAMS**

In `src/defaults.ts`, delete lines 7-8:

```typescript
// DELETE THESE LINES:
  overhangMode: 'full',
  customOverhang: 0,
```

**Step 3: Run tests to verify they fail**

Run: `bun test`

Expected: Many tests FAIL with TypeScript errors about overhangMode

**Step 4: Commit type system changes**

```bash
git add src/types.ts src/defaults.ts
git commit -m "refactor: remove overhangMode and customOverhang from types"
```

---

### Task 4: Fix Toolpath Implementation After Type Changes

**Files:**
- Modify: `src/toolpath.ts:50-53`

**Step 1: Remove overhangMode check from toolpath calculation**

In `src/toolpath.ts`, replace lines 50-53:

```typescript
// OLD:
  const steppingOverhang = params.overhangMode === 'full'
    ? bitRadius - stepover
    : params.customOverhang

// NEW:
  const steppingOverhang = bitRadius - stepover
```

**Step 2: Run tests**

Run: `bun test src/toolpath.test.ts`

Expected: Still failing because test files still reference overhangMode

**Step 3: Commit**

```bash
git add src/toolpath.ts
git commit -m "refactor: simplify overhang calculation after type removal"
```

---

### Task 5: Fix Toolpath Tests

**Files:**
- Modify: `src/toolpath.test.ts`

**Step 1: Remove overhangMode from all test cases**

In `src/toolpath.test.ts`, find and remove all instances of:
- `overhangMode: 'full',`
- `overhangMode: 'custom',`
- `customOverhang: X,`

Affected tests (lines to modify):
- Line 13: Remove `overhangMode: 'full',`
- Line 34: Remove `overhangMode: 'full',`
- Lines 51-56: Delete entire test "uses custom overhang when specified"
- Line 162: Remove `overhangMode: 'full',`
- Line 208: Remove `overhangMode: 'full',`
- Lines 238-269: Remove `overhangMode: 'full',` from all 4 new test cases

**Step 2: Run tests to verify they pass**

Run: `bun test src/toolpath.test.ts`

Expected: All toolpath tests PASS

**Step 3: Commit**

```bash
git add src/toolpath.test.ts
git commit -m "test: remove overhangMode references from toolpath tests"
```

---

### Task 6: Fix GCode and Preview Tests

**Files:**
- Modify: `src/gcode.test.ts`
- Modify: `src/preview.test.ts`

**Step 1: Check if gcode tests reference overhangMode**

Run: `bun test src/gcode.test.ts`

If tests fail with overhangMode errors, search file for `overhangMode` and remove all instances.

**Step 2: Check if preview tests reference overhangMode**

Run: `bun test src/preview.test.ts`

If tests fail with overhangMode errors, search file for `overhangMode` and remove all instances.

**Step 3: Run all tests**

Run: `bun test`

Expected: All tests PASS (30 total: 26 original - 1 deleted + 4 new = 29, might be 30 depending on other files)

**Step 4: Commit**

```bash
git add src/gcode.test.ts src/preview.test.ts
git commit -m "test: remove overhangMode references from remaining tests"
```

---

### Task 7: Update UI to Remove Overhang Controls

**Files:**
- Modify: `src/ui.ts`

**Step 1: Remove overhang form fields from HTML**

In `src/ui.ts`, delete lines 35-46 (the overhang section):

```typescript
// DELETE THIS ENTIRE SECTION:
      <div class="form-row">
        <label>Overhang</label>
        <div class="radio-group">
          <label><input type="radio" name="overhangMode" value="full" checked> Full</label>
          <label><input type="radio" name="overhangMode" value="custom"> Custom</label>
        </div>
      </div>
      <div class="form-row conditional-field hidden" id="customOverhangRow">
        <label for="customOverhang">Amount</label>
        <input type="number" id="customOverhang" value="0.5" step="0.125" min="0">
        <span class="unit">in</span>
      </div>
```

**Step 2: Remove overhangMode event listeners**

Find the section in `createForm()` that handles overhangMode radio buttons (around line 120) and remove it:

```typescript
// DELETE THIS SECTION:
  const overhangRadios = form.querySelectorAll('input[name="overhangMode"]')
  overhangRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      const customOverhangRow = form.querySelector('#customOverhangRow')
      if (customOverhangRow) {
        if (target.value === 'custom') {
          customOverhangRow.classList.remove('hidden')
        } else {
          customOverhangRow.classList.add('hidden')
        }
      }
      notifyUpdate()
    })
  })

  const customOverhangInput = form.querySelector('#customOverhang') as HTMLInputElement | null
  if (customOverhangInput) {
    customOverhangInput.addEventListener('input', notifyUpdate)
  }
```

**Step 3: Remove overhangMode from getFormValues**

Find the `getFormValues()` function and remove these lines:

```typescript
// DELETE THESE LINES:
    const overhangMode = (form.querySelector('input[name="overhangMode"]:checked') as HTMLInputElement | null)?.value as 'full' | 'custom' | undefined
    if (overhangMode) params.overhangMode = overhangMode

    const customOverhangInput = form.querySelector('#customOverhang') as HTMLInputElement | null
    if (customOverhangInput?.value) params.customOverhang = parseFloat(customOverhangInput.value)
```

**Step 4: Test manually**

Run: `bun run dev`

Expected:
1. Form loads without overhang section
2. Preview updates correctly
3. Can adjust bit diameter and stepover
4. Generated GCode has correct coordinate bounds

**Step 5: Commit**

```bash
git add src/ui.ts
git commit -m "refactor: remove overhang controls from UI"
```

---

### Task 8: Run Final Verification

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `bun test`

Expected: All tests pass

**Step 2: Build production bundle**

Run: `bun run build`

Expected: Build succeeds with no errors

**Step 3: Manual testing in dev mode**

Run: `bun run dev`

Test scenarios:
1. **X-axis raster, 50% stepover:**
   - Enter: stockWidth=10, stockHeight=5, bitDiameter=1.25, stepoverPercent=50, rasterDirection=X
   - Download GCode
   - Verify X coordinates go from -0.625 to 10.625 (full overhang)
   - Verify Y coordinates start at 0 (optimized overhang = 0)

2. **Y-axis raster, 25% stepover:**
   - Change: rasterDirection=Y, stepoverPercent=25
   - Download GCode
   - Verify Y coordinates go from -0.625 to 5.625 (full overhang)
   - Verify X coordinates start at 0.3125 (optimized overhang)

3. **Large stepover (75%):**
   - Change: stepoverPercent=75
   - Download GCode
   - Verify negative overhang (bit center starts inside stock on stepping axis)

**Step 4: Test production build**

Run: `bun run preview`

Or open `dist/index.html` in browser.

Expected: All functionality works in offline mode

**Step 5: Final commit**

```bash
git status
git commit --allow-empty -m "chore: verify separate overhang implementation complete"
```

---

## Verification Checklist

- [ ] All unit tests pass (29-30 tests)
- [ ] X-axis raster has full X overhang, optimized Y overhang
- [ ] Y-axis raster has full Y overhang, optimized X overhang
- [ ] Stepover percentage affects stepping overhang only
- [ ] UI no longer has overhang mode selection
- [ ] GCode output has correct coordinate ranges
- [ ] Production build works offline
- [ ] Manual testing confirms correct behavior for various stepover values
