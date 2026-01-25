# Snaking Raster Pattern Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement efficient snaking raster toolpath that eliminates unnecessary retracts between lines.

**Architecture:** Modify the `generatePass()` function in `gcode.ts` to keep the bit at cutting depth while moving between raster lines using G1 feed rate moves. The toolpath calculation already provides alternating directions, we just need to use them properly.

**Tech Stack:** TypeScript, Bun test runner

---

## Task 1: Add Test for Snaking Pattern (X-axis raster)

**Files:**
- Modify: `src/gcode.test.ts`

**Step 1: Write the failing test**

Add this test to the describe block in `src/gcode.test.ts`:

```typescript
test('X-axis raster uses snaking pattern with single retract per pass', () => {
  const params = mergeWithDefaults({
    stockWidth: 2,
    stockHeight: 2,
    bitDiameter: 1,
    stepoverPercent: 50,
    rasterDirection: 'x',
    numPasses: 1,
    skimPass: false,
  })
  const toolpath = calculateToolpath(params)
  const gcode = generateGCode(toolpath)

  // Split into lines for analysis
  const lines = gcode.split('\n')

  // Find the pass section (between first plunge and final retract)
  const firstPlungeIdx = lines.findIndex(l => l.includes('G1 Z-') && l.includes('Plunge'))
  const finalRetractIdx = lines.findIndex(l => l.includes('Final retract'))
  const passLines = lines.slice(firstPlungeIdx, finalRetractIdx)

  // Count retracts in the pass (should be 0)
  const retractCount = passLines.filter(l => l.includes('G0 Z')).length
  expect(retractCount).toBe(0)

  // Verify stepover moves use G1 (feed rate)
  const stepoverLines = passLines.filter(l => l.includes('Stepover'))
  expect(stepoverLines.length).toBeGreaterThan(0)
  stepoverLines.forEach(line => {
    expect(line).toContain('G1')
    expect(line).toContain('Y') // X-axis raster steps in Y
    expect(line).not.toContain('X') // Should only move in Y
  })

  // Verify cutting moves alternate direction
  const cutLines = passLines.filter(l => l.includes('Cut'))
  expect(cutLines.length).toBeGreaterThan(1)
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/gcode.test.ts`

Expected: FAIL - the test should fail because current implementation has retracts between lines

**Step 3: Commit**

```bash
git add src/gcode.test.ts
git commit -m "test: add snaking pattern test for X-axis raster"
```

---

## Task 2: Add Test for Snaking Pattern (Y-axis raster)

**Files:**
- Modify: `src/gcode.test.ts`

**Step 1: Write the failing test**

Add this test to the describe block:

```typescript
test('Y-axis raster uses snaking pattern with single retract per pass', () => {
  const params = mergeWithDefaults({
    stockWidth: 2,
    stockHeight: 2,
    bitDiameter: 1,
    stepoverPercent: 50,
    rasterDirection: 'y',
    numPasses: 1,
    skimPass: false,
  })
  const toolpath = calculateToolpath(params)
  const gcode = generateGCode(toolpath)

  const lines = gcode.split('\n')
  const firstPlungeIdx = lines.findIndex(l => l.includes('G1 Z-') && l.includes('Plunge'))
  const finalRetractIdx = lines.findIndex(l => l.includes('Final retract'))
  const passLines = lines.slice(firstPlungeIdx, finalRetractIdx)

  // Count retracts in the pass (should be 0)
  const retractCount = passLines.filter(l => l.includes('G0 Z')).length
  expect(retractCount).toBe(0)

  // Verify stepover moves use G1 and move in X only
  const stepoverLines = passLines.filter(l => l.includes('Stepover'))
  expect(stepoverLines.length).toBeGreaterThan(0)
  stepoverLines.forEach(line => {
    expect(line).toContain('G1')
    expect(line).toContain('X') // Y-axis raster steps in X
    expect(line).not.toContain('Y') // Should only move in X
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/gcode.test.ts`

Expected: FAIL

**Step 3: Commit**

```bash
git add src/gcode.test.ts
git commit -m "test: add snaking pattern test for Y-axis raster"
```

---

## Task 3: Implement Snaking Pattern for X-axis Raster

**Files:**
- Modify: `src/gcode.ts:49-85` (the `generatePass` function)

**Step 1: Update generatePass function for X-axis raster**

Replace the X-axis raster section (lines 54-65) with:

```typescript
    if (direction === 'x') {
      // X-axis raster
      if (lineIndex === 0) {
        // First line: rapid to start, plunge, cut
        lines.push(`G0 Y${fmt(line.y!)}`)
        lines.push(`G0 X${fmt(line.xStart!)}`)
        lines.push(`G1 Z${fmt(pass.z)} F${plungeRate} ; Plunge`)
        lines.push(`G1 X${fmt(line.xEnd!)} F${feedRate} ; Cut`)
      } else {
        // Subsequent lines: stepover at cutting depth, then cut
        lines.push(`G1 Y${fmt(line.y!)} F${feedRate} ; Stepover`)
        lines.push(`G1 X${fmt(line.xEnd!)} F${feedRate} ; Cut`)
      }
    }
```

Note: We removed the retract/plunge between lines. The bit stays at cutting depth and moves in Y to the next line, then cuts in X.

**Step 2: Run X-axis tests**

Run: `bun test src/gcode.test.ts -t "X-axis"`

Expected: PASS for the X-axis snaking test

**Step 3: Commit**

```bash
git add src/gcode.ts
git commit -m "feat: implement snaking pattern for X-axis raster"
```

---

## Task 4: Implement Snaking Pattern for Y-axis Raster

**Files:**
- Modify: `src/gcode.ts:49-85` (the `generatePass` function)

**Step 1: Update generatePass function for Y-axis raster**

Replace the Y-axis raster section (lines 66-79) with:

```typescript
    } else {
      // Y-axis raster
      if (lineIndex === 0) {
        // First line: rapid to start, plunge, cut
        lines.push(`G0 X${fmt(line.x!)}`)
        lines.push(`G0 Y${fmt(line.yStart!)}`)
        lines.push(`G1 Z${fmt(pass.z)} F${plungeRate} ; Plunge`)
        lines.push(`G1 Y${fmt(line.yEnd!)} F${feedRate} ; Cut`)
      } else {
        // Subsequent lines: stepover at cutting depth, then cut
        lines.push(`G1 X${fmt(line.x!)} F${feedRate} ; Stepover`)
        lines.push(`G1 Y${fmt(line.yEnd!)} F${feedRate} ; Cut`)
      }
    }
```

**Step 2: Run Y-axis tests**

Run: `bun test src/gcode.test.ts -t "Y-axis"`

Expected: PASS for the Y-axis snaking test

**Step 3: Commit**

```bash
git add src/gcode.ts
git commit -m "feat: implement snaking pattern for Y-axis raster"
```

---

## Task 5: Run All Tests

**Files:**
- Test: `src/gcode.test.ts`

**Step 1: Run full test suite**

Run: `bun test`

Expected: All tests PASS

**Step 2: If any tests fail, investigate and fix**

The existing tests should still pass. If they don't, investigate why.

---

## Task 6: Update Documentation in gcode.ts

**Files:**
- Modify: `src/gcode.ts:1-10`

**Step 1: Add explanatory comments**

Add this comment block at the top of the `generatePass` function (around line 49):

```typescript
/**
 * Generates GCode for a single Z-depth pass using a snaking raster pattern.
 *
 * The bit plunges once at the start, then stays at cutting depth while:
 * 1. Cutting the first line
 * 2. Stepping over to the next line at feed rate (G1)
 * 3. Cutting the next line in the opposite direction
 * 4. Repeating until all lines are complete
 * 5. Retracting once at the end
 *
 * Stepover moves use G1 (feed rate) instead of G0 (rapid) for safety - if
 * material exists outside the defined stock bounds, the bit will cut through
 * it at a controlled speed rather than breaking on a rapid move.
 *
 * @param pass - The Z pass with raster lines
 * @param safeZ - Safe retract height
 * @param feedRate - Cutting feed rate (in/min)
 * @param plungeRate - Z-axis plunge rate (in/min)
 * @param direction - Raster direction ('x' or 'y')
 * @returns Array of GCode command strings
 */
function generatePass(pass: ZPass, safeZ: number, feedRate: number, plungeRate: number, direction: 'x' | 'y'): string[] {
```

**Step 2: Commit**

```bash
git add src/gcode.ts
git commit -m "docs: add comments explaining snaking pattern implementation"
```

---

## Task 7: Verify Preview Shows Snaking Pattern

**Files:**
- Test: `src/preview.ts`

**Step 1: Run the dev server and visually check**

Run: `bun run dev`

Open browser to dev server URL

**Step 2: Visual verification checklist**

- [ ] Enter stock dimensions (e.g., 10" x 5")
- [ ] Verify raster lines are drawn
- [ ] Lines should alternate direction (this should already work)
- [ ] Note: Stepover moves between lines are NOT currently drawn (this is expected - we noted this in the design as a future enhancement)

**Step 3: Take note for future work**

The preview currently only draws the cutting lines, not the stepover moves. This is acceptable for now but we noted in the design doc that adding visual representation of stepovers (as dashed lines or different color) would be a good enhancement.

No changes needed for this task.

---

## Task 8: Manual GCode Verification

**Files:**
- Test: Manual verification of generated GCode

**Step 1: Build and open the app**

Run: `bun run build && open dist/index.html`

**Step 2: Generate sample GCode**

- Enter: Stock 10" x 5", X-axis raster, 1 pass, no skim pass
- Click "Download GCode"
- Open the downloaded file

**Step 3: Verify GCode structure**

Look for pattern in the pass section:
```
G0 Y...             ; Position to first line
G0 X...             ; Position to start
G1 Z... F12         ; Plunge
G1 X... F125        ; Cut first line
G1 Y... F125        ; Stepover (no retract!)
G1 X... F125        ; Cut second line
G1 Y... F125        ; Stepover (no retract!)
G1 X... F125        ; Cut third line
...
G0 Z0.125           ; Retract after pass
```

Verify:
- [ ] Only ONE plunge per pass (at start)
- [ ] Only ONE retract per pass (at end)
- [ ] Stepover moves use G1 F125 (feed rate)
- [ ] X-axis raster has stepover in Y only
- [ ] No G0 Z commands between lines

**Step 4: Test Y-axis raster**

Change to Y-axis raster and verify:
- [ ] Stepover moves are in X only
- [ ] Same snaking pattern applies

No commit needed for manual verification.

---

## Task 9: Update TODO List

**Files:**
- Modify: `docs/todo.md`

**Step 1: Mark snaking pattern task as complete**

Remove or comment out the first item in the todo list:

```markdown
# ~~Confirm raster pattern snakes back and forth~~ COMPLETE
~~It appears as though it might move left to right, then retract and rapid to the next line, then move right to left, then retract and rapid to the next line, etc. Instead, it should move left to right, then rapid to the next line, then move right to left, then rapid to the next line, etc. It should not retract until it has finished the entire pattern and is ready to begin the next pass.~~

Implemented 2026-01-25: Snaking pattern now keeps bit at cutting depth, uses G1 stepover moves for safety.
```

**Step 2: Commit**

```bash
git add docs/todo.md
git commit -m "docs: mark snaking raster pattern task as complete"
```

---

## Task 10: Final Review and Merge Preparation

**Files:**
- Review: All modified files

**Step 1: Review all changes**

Run: `git log --oneline feature/snaking-raster-pattern`

Verify commits are clean and messages are clear.

**Step 2: Run full test suite one more time**

Run: `bun test`

Expected: All tests PASS

**Step 3: Build production bundle**

Run: `bun run build`

Expected: Build completes successfully, no errors

**Step 4: Create summary**

The feature is complete. Ready for PR or merge to main.

Changes made:
- Modified `src/gcode.ts` to implement snaking pattern
- Added tests in `src/gcode.test.ts` to verify behavior
- Updated documentation in code comments
- Marked todo item as complete

Benefits achieved:
- Eliminates N-1 retract/plunge cycles per pass
- Reduces machining time significantly
- Uses G1 for stepovers (safer than G0)
- Standard CNC surfacing pattern

---

## Notes

**TDD Approach:** Each task follows Test-Driven Development - write test, verify failure, implement, verify pass, commit.

**YAGNI:** We're not adding preview enhancements for stepover visualization yet - that's noted as a future enhancement but not required for core functionality.

**Safety First:** Using G1 for stepovers ensures safety if material exists outside defined bounds.

**Frequent Commits:** Each logical unit of work gets its own commit with clear message.
