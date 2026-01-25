# Snaking Raster Pattern Design

**Date:** 2026-01-25
**Status:** Design Complete

## Problem

The current GCode generator retracts to safe Z between every raster line, then rapids to the next line and plunges again. This is inefficient and causes unnecessary wear on the machine.

Investigation of the code revealed:
- `toolpath.ts` correctly calculates alternating line directions (via `isEven` logic)
- `gcode.ts:60-64` and `gcode.ts:73-77` retract/plunge between every line
- The alternating directions aren't being utilized

## Solution

Implement a snaking raster pattern where the bit:
1. Plunges once at the start of each pass
2. Cuts the first line at feed rate
3. Steps over to the next line at feed rate (staying at cutting depth)
4. Cuts the next line in the opposite direction
5. Repeats until all lines in the pass are complete
6. Retracts once at the end of the pass

This reduces retracts from N (one per line) to 1 (one per pass).

## Design Decisions

### Stepover Movement: G1 (Feed Rate)

Use G1 (feed rate) for stepover moves instead of G0 (rapid) because:
- Stock may not be a perfect rectangle
- Material could exist outside defined bounds
- Rapid move at cutting depth into unexpected material could break the bit
- Feed rate move will cut through any material safely

### Stepover Direction

The stepover is a single-axis move in the stepping direction:
- **X-axis raster:** Lines run along X, stepover moves in Y only
- **Y-axis raster:** Lines run along Y, stepover moves in X only

No diagonal moves needed because alternating lines end at the X/Y position where the next line starts.

## Implementation

### Core Changes to `gcode.ts`

Modify `generatePass()` function:

**For first line in a pass:**
- Rapid position to start (X/Y at safe Z)
- Plunge to cutting depth (Z)
- Cut the line at feed rate

**For subsequent lines:**
- Continue at feed rate to step over to next line's start position (single axis move)
- Cut the line at feed rate (alternating direction)

**After all lines:**
- Retract to safe Z once

### GCode Structure Per Pass

```
G0 X... Y...        ; Rapid to start of first line
G1 Z... F...        ; Plunge
G1 X.../Y... F...   ; Cut first line
G1 Y.../X... F...   ; Stepover to second line (Y-only for X-raster, X-only for Y-raster)
G1 X.../Y... F...   ; Cut second line (opposite direction)
G1 Y.../X... F...   ; Stepover to third line
G1 X.../Y... F...   ; Cut third line
...
G0 Z...             ; Retract after entire pass
```

## Testing

Update `gcode.test.ts` to verify:
- Only one retract per pass (at the end)
- Stepover moves use G1 (feed rate)
- Lines alternate direction correctly
- Stepover moves are in correct axis (Y for X-raster, X for Y-raster)
- No retracts between lines

## Preview Updates

The SVG preview should already show alternating directions since `toolpath.ts` calculates them correctly. However:
- Verify snaking pattern is visually clear
- Consider drawing stepover moves differently (dashed line or different color) to show bit stays at cutting depth
- This addresses the todo item about stepover visibility

## Documentation

Update comments in `gcode.ts` to explain:
- Snaking pattern implementation
- Why G1 is used for stepovers (safety rationale)
- How alternating directions work

## Benefits

- **Faster operation:** Eliminates N-1 retract/plunge cycles per pass
- **Less wear:** Reduces Z-axis movement and spindle stress
- **Safer:** Feed rate stepovers handle unexpected material gracefully
- **Standard practice:** Snaking is the expected pattern for surfacing operations
