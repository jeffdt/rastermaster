# Remove Numeric Spinners Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove spinner buttons from decimal inputs while keeping them for integer fields where incrementing makes sense.

**Architecture:** Convert decimal numeric inputs to text fields with `inputmode="decimal"` and pattern validation. Keep integer inputs (# Passes, Pause every) as `type="number"` with spinners.

**Tech Stack:** TypeScript, Bun test runner, happy-dom

---

## Task 1: Add tests for text input parsing

**Files:**
- Modify: `src/ui.test.ts`

**Step 1: Write failing test for decimal text input parsing**

Add this test to `src/ui.test.ts` after the existing `updateFormVisibility` tests:

```typescript
describe('getFormValues', () => {
  test('parses decimal text inputs correctly', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="text" id="stockWidth" value="12.5">
      <input type="text" id="stockHeight" value="8.25">
      <input type="text" id="bitDiameter" value="1.25">
      <input type="text" id="stepoverPercent" value="50">
      <input type="text" id="depthPerPass" value="0.01">
      <input type="text" id="feedRate" value="125">
      <input type="text" id="plungeRate" value="30">
      <input type="text" id="spindleRpm" value="18000">
      <input type="text" id="safeZ" value="0.125">
      <input type="number" id="numPasses" value="3">
      <input type="number" id="pauseInterval" value="0">
      <input type="checkbox" id="skimPass">
      <input type="radio" name="rasterDirection" value="x" checked>
    `

    const values = getFormValues(form)

    expect(values.stockWidth).toBe(12.5)
    expect(values.stockHeight).toBe(8.25)
    expect(values.bitDiameter).toBe(1.25)
    expect(values.stepoverPercent).toBe(50)
    expect(values.depthPerPass).toBe(0.01)
    expect(values.feedRate).toBe(125)
    expect(values.plungeRate).toBe(30)
    expect(values.spindleRpm).toBe(18000)
    expect(values.safeZ).toBe(0.125)
    expect(values.numPasses).toBe(3)
    expect(values.pauseInterval).toBe(0)
  })

  test('handles invalid text input gracefully', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input type="text" id="stockWidth" value="abc">
      <input type="text" id="stockHeight" value="">
      <input type="text" id="bitDiameter" value="1.25">
      <input type="text" id="stepoverPercent" value="50">
      <input type="text" id="depthPerPass" value="0.01">
      <input type="text" id="feedRate" value="125">
      <input type="text" id="plungeRate" value="30">
      <input type="text" id="spindleRpm" value="18000">
      <input type="text" id="safeZ" value="0.125">
      <input type="number" id="numPasses" value="3">
      <input type="number" id="pauseInterval" value="0">
      <input type="checkbox" id="skimPass">
      <input type="radio" name="rasterDirection" value="x" checked>
    `

    const values = getFormValues(form)

    expect(isNaN(values.stockWidth!)).toBe(true)
    expect(isNaN(values.stockHeight!)).toBe(true)
  })
})
```

**Step 2: Add import for getFormValues**

At the top of `src/ui.test.ts`, update the import line:

```typescript
import { updateFormVisibility, getFormValues } from './ui'
```

**Step 3: Run test to verify it fails**

Run: `bun test src/ui.test.ts`
Expected: Tests fail because inputs are still type="number" in actual implementation

**Step 4: Commit**

```bash
git add src/ui.test.ts
git commit -m "test: add tests for text input parsing

Tests verify that getFormValues correctly parses decimal text inputs
and handles invalid input gracefully.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Convert decimal inputs to text fields

**Files:**
- Modify: `src/ui.ts:14,19,44,60,65,70,77,82,87`

**Step 1: Convert stockWidth to text input**

Change line 14 from:
```typescript
<input type="number" id="stockWidth" step="0.1" min="0.1" required>
```

to:
```typescript
<input type="text" id="stockWidth" inputmode="decimal" pattern="[0-9]*\.?[0-9]*" required>
```

**Step 2: Convert stockHeight to text input**

Change line 19 from:
```typescript
<input type="number" id="stockHeight" step="0.1" min="0.1" required>
```

to:
```typescript
<input type="text" id="stockHeight" inputmode="decimal" pattern="[0-9]*\.?[0-9]*" required>
```

**Step 3: Convert depthPerPass to text input**

Change line 44 from:
```typescript
<input type="number" id="depthPerPass" value="${DEFAULT_PARAMS.depthPerPass}" step="0.005" min="0">
```

to:
```typescript
<input type="text" id="depthPerPass" value="${DEFAULT_PARAMS.depthPerPass}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 4: Convert bitDiameter to text input**

Change line 60 from:
```typescript
<input type="number" id="bitDiameter" value="${DEFAULT_PARAMS.bitDiameter}" step="0.125" min="0.125">
```

to:
```typescript
<input type="text" id="bitDiameter" value="${DEFAULT_PARAMS.bitDiameter}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 5: Convert stepoverPercent to text input**

Change line 65 from:
```typescript
<input type="number" id="stepoverPercent" value="${DEFAULT_PARAMS.stepoverPercent}" step="5" min="10" max="100">
```

to:
```typescript
<input type="text" id="stepoverPercent" value="${DEFAULT_PARAMS.stepoverPercent}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 6: Convert feedRate to text input**

Change line 70 from:
```typescript
<input type="number" id="feedRate" value="${DEFAULT_PARAMS.feedRate}" step="5" min="0">
```

to:
```typescript
<input type="text" id="feedRate" value="${DEFAULT_PARAMS.feedRate}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 7: Convert plungeRate to text input**

Change line 77 from:
```typescript
<input type="number" id="plungeRate" value="${DEFAULT_PARAMS.plungeRate}" step="1" min="1">
```

to:
```typescript
<input type="text" id="plungeRate" value="${DEFAULT_PARAMS.plungeRate}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 8: Convert spindleRpm to text input**

Change line 82 from:
```typescript
<input type="number" id="spindleRpm" value="${DEFAULT_PARAMS.spindleRpm}" step="500" min="1000">
```

to:
```typescript
<input type="text" id="spindleRpm" value="${DEFAULT_PARAMS.spindleRpm}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 9: Convert safeZ to text input**

Change line 87 from:
```typescript
<input type="number" id="safeZ" value="${DEFAULT_PARAMS.safeZ}" step="0.125" min="0">
```

to:
```typescript
<input type="text" id="safeZ" value="${DEFAULT_PARAMS.safeZ}" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">
```

**Step 10: Run tests to verify they pass**

Run: `bun test`
Expected: All 44 tests pass (42 existing + 2 new)

**Step 11: Commit**

```bash
git add src/ui.ts
git commit -m "feat: remove spinner buttons from decimal inputs

Convert all decimal numeric inputs to text fields with inputmode=decimal
and pattern validation. Keep type=number only for integer fields
(# Passes, Pause every) where spinners make sense.

This removes spinner buttons and arrow key/scroll increment behavior
from fields where users type specific values.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Manual testing and verification

**Files:**
- None (manual testing only)

**Step 1: Start dev server**

Run: `bun run dev`
Expected: Dev server starts on http://localhost:5173

**Step 2: Test decimal fields have no spinners**

1. Open browser to http://localhost:5173
2. Enter stock dimensions to reveal all fields
3. Verify these fields show NO spinner buttons:
   - Stock Width, Stock Height
   - Bit Diameter, Stepover, Feed Rate
   - Plunge Rate, Spindle Speed, Safe Z
   - Depth per Pass

**Step 3: Test integer fields still have spinners**

Verify these fields still show spinner buttons:
- # Passes
- Pause every

**Step 4: Test mobile keyboard (Chrome DevTools)**

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Click on Stock Width field
5. Verify numeric keyboard appears (not full QWERTY)

**Step 5: Test arrow keys don't increment**

1. Focus Stock Width field
2. Press up/down arrow keys
3. Verify value doesn't change (cursor moves instead)
4. Test mouse wheel scroll
5. Verify value doesn't change

**Step 6: Test validation**

1. Enter "abc" in Stock Width
2. Try to generate GCode
3. Verify appropriate error handling (validateParams should catch it)

**Step 7: Stop dev server**

Press Ctrl+C in terminal

**Step 8: Document manual test results**

Create file: `docs/manual-testing/2026-01-26-spinner-removal.md`

```markdown
# Manual Testing: Spinner Removal

**Date:** 2026-01-26
**Tester:** [Your name]
**Browser:** Chrome/Firefox/Safari [version]

## Test Results

- [ ] Decimal fields show no spinners
- [ ] Integer fields still have spinners
- [ ] Mobile keyboard is numeric
- [ ] Arrow keys don't increment decimal fields
- [ ] Mouse wheel doesn't increment decimal fields
- [ ] Invalid text input is caught by validation
- [ ] Form still functions correctly

## Notes

[Any observations or issues]
```

**Step 9: Commit manual test results**

```bash
git add docs/manual-testing/2026-01-26-spinner-removal.md
git commit -m "docs: add manual testing results for spinner removal

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Production build verification

**Files:**
- None (build verification only)

**Step 1: Build production bundle**

Run: `bun run build`
Expected: Build completes successfully, creates dist/index.html

**Step 2: Preview production build**

Run: `bun run preview`
Expected: Preview server starts

**Step 3: Test production build**

1. Open preview URL in browser
2. Verify decimal fields have no spinners
3. Verify integer fields have spinners
4. Test form functionality

**Step 4: Stop preview server**

Press Ctrl+C

**Step 5: Verify all tests still pass**

Run: `bun test`
Expected: All 44 tests pass

**Step 6: Commit if any fixes were needed**

If you made any fixes during this task:
```bash
git add .
git commit -m "fix: [description of fix]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] All tests pass (44 tests)
- [ ] Manual testing completed and documented
- [ ] Production build verified
- [ ] Decimal fields use type="text" with inputmode="decimal"
- [ ] Integer fields still use type="number"
- [ ] No spinner buttons on decimal fields
- [ ] Spinner buttons still present on integer fields
- [ ] Mobile keyboard optimization working
- [ ] Arrow keys/scroll don't increment decimal fields

---

## Next Steps

After implementation is complete:

1. Use @superpowers:finishing-a-development-branch to decide merge strategy
2. Update docs/todo.md to mark item as complete
3. Consider tackling next item from todo.md
