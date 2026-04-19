# Pass Mode: Total Depth vs. Num Passes

**Date:** 2026-04-18

## Problem

Users sometimes want to run a fixed number of passes without caring about total material removal. The existing UI only accepts total depth, forcing users to do mental math (`numPasses * depthPerPass`).

## Solution

Add a `passMode` toggle to the Job section that switches between two input modes:

- **Total Depth** (existing): user specifies total depth in inches; pass count is derived as `ceil(totalDepth / depthPerPass)`
- **Num Passes** (new): user specifies integer pass count directly; total depth is a derived consequence (`numPasses * depthPerPass`)

## Data Model

Two additions to `SurfacingParams` in `types.ts`:

```ts
passMode: 'totalDepth' | 'numPasses'
numPasses: number  // 0 = not set (same convention as totalDepth)
```

`DEFAULT_PARAMS` sets `passMode: 'totalDepth'` and `numPasses: 0`.

`ToolSettings` does not include `passMode` or `numPasses` -- these are job-level, not tool-level.

## UI

The "Total Depth" label in the Job section becomes an inline segmented pill:

```
[ Total Depth | # Passes ]
```

Selecting a segment:
- Swaps the label text and unit (inches vs. unitless integer)
- Clears the input value to avoid carrying over a nonsensical value
- Updates `passMode` in form state

The input field position does not change. All other Job rows are unaffected.

`passMode` is persisted to URL params and local storage settings alongside existing params.

## Toolpath Logic

`toolpath.ts` gets a named helper to resolve pass count:

```ts
function resolveDepthPassCount(params: SurfacingParams): number {
  if (params.passMode === 'numPasses') return params.numPasses
  if (params.totalDepth <= 0) return 0
  return Math.ceil(params.totalDepth / params.depthPerPass - 1e-9)
}
```

Called in `calculateToolpath()` where `depthPassCount` is currently computed inline. No other modules in the pipeline need to know about `passMode`.

## Validation

- `totalDepth` mode: existing validation unchanged
- `numPasses` mode: must be a positive integer; 0 is treated as "not set" (no depth passes, skim only)

## Persistence

`passMode` and `numPasses` are added to URL sharing and settings auto-save alongside existing params. Loading a URL with `passMode=numPasses` restores the pill state and shows the num passes input.

## Testing

- Unit tests for `resolveDepthPassCount` covering both modes, edge cases (0, fractional totalDepth, large numPasses)
- UI tests for pill toggle: correct field shown, value cleared on switch, form values reflect correct mode
- Existing toolpath and gcode tests must continue passing
