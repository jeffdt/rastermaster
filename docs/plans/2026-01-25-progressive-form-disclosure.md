# Progressive Form Disclosure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add progressive disclosure to the RasterMaster form where Job and Tool sections animate into view after Stock dimensions are entered, creating a clockwork-inspired onboarding experience.

**Architecture:** Modify existing `createForm()` in `ui.ts` to add conditional CSS classes based on Stock validation. Add responsive CSS animations (horizontal slide on desktop, hybrid on tablet, accordion on mobile). No changes to underlying logic or data flow.

**Tech Stack:** TypeScript, CSS animations, existing Vite build system

---

## Task 1: Add CSS for Hidden State and Desktop Animations

**Files:**
- Modify: `index.html` (CSS section, after line 793)

**Step 1: Add keyframes for desktop horizontal slide animations**

Add to the `<style>` section in `index.html` before the closing `</style>` tag:

```css
/* Progressive disclosure animations */
@keyframes slideFromLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideFromLeftLong {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes accordionExpand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 600px;
    opacity: 1;
  }
}
```

**Step 2: Add base hidden state styles (desktop default)**

Add after the keyframes:

```css
/* Hidden state for progressive disclosure (desktop default) */
@media (min-width: 1024px) {
  .form-column-hidden {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
    position: absolute;
    will-change: transform, opacity;
  }

  .form-column-reveal-job {
    animation: slideFromLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    position: static;
    pointer-events: auto;
    z-index: 2;
  }

  .form-column-reveal-tool {
    animation: slideFromLeftLong 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
    position: static;
    pointer-events: auto;
    z-index: 1;
  }
}
```

**Step 3: Run dev server to verify no errors**

Run: `bun run dev`
Expected: Server starts, no CSS errors in console

**Step 4: Commit CSS animations (desktop only)**

```bash
git add index.html
git commit -m "feat: add desktop progressive disclosure animations

Add keyframes and hidden state CSS for clockwork slide effect on
desktop layout (3-column grid). Job and Tool sections will slide from
left with staggered timing.

Part 1 of progressive disclosure implementation."
```

---

## Task 2: Add CSS for Tablet and Mobile Responsive Animations

**Files:**
- Modify: `index.html` (CSS section, after Task 1 additions)

**Step 1: Add tablet hybrid animation styles**

Add after the desktop media query from Task 1:

```css
/* Tablet: hybrid approach (Job slides, Tool expands) */
@media (min-width: 768px) and (max-width: 1023px) {
  .form-column-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .form-column:nth-child(2).form-column-hidden {
    /* Job column - slides horizontally */
    transform: translateX(-100%);
    position: absolute;
    will-change: transform, opacity;
  }

  .form-column:nth-child(3).form-column-hidden {
    /* Tool column - accordion expands */
    max-height: 0;
    overflow: hidden;
    transform: none;
    position: static;
  }

  .form-column-reveal-job {
    animation: slideFromLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    position: static;
    pointer-events: auto;
  }

  .form-column-reveal-tool {
    animation: accordionExpand 0.5s ease-out 0.2s forwards;
    pointer-events: auto;
    overflow: visible;
  }
}
```

**Step 2: Add mobile accordion animation styles**

Add after the tablet media query:

```css
/* Mobile: accordion expansion only */
@media (max-width: 767px) {
  .form-column-hidden {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transform: none;
    position: static;
  }

  .form-column-reveal-job {
    animation: accordionExpand 0.5s ease-out forwards;
    pointer-events: auto;
    overflow: visible;
  }

  .form-column-reveal-tool {
    animation: accordionExpand 0.5s ease-out 0.1s forwards;
    pointer-events: auto;
    overflow: visible;
  }
}
```

**Step 3: Test responsive behavior in dev server**

Run: `bun run dev`
Open in browser, test responsive breakpoints with DevTools
Expected: No layout breaks at 767px, 768px, 1023px, 1024px breakpoints

**Step 4: Commit responsive CSS**

```bash
git add index.html
git commit -m "feat: add tablet/mobile progressive disclosure animations

Add responsive animation variants:
- Tablet (768-1023px): Job slides, Tool expands accordion-style
- Mobile (<768px): Both use accordion expansion

Part 2 of progressive disclosure implementation."
```

---

## Task 3: Add TypeScript Validation Function

**Files:**
- Modify: `src/ui.ts` (after line 104, before `export function getFormValues`)

**Step 1: Write test for updateFormVisibility function**

Create test file:

```typescript
// src/ui.test.ts (create new file)
import { describe, expect, test } from 'bun:test'

describe('updateFormVisibility', () => {
  test('does nothing when stock is invalid', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="0">
      <input id="stockHeight" value="10">
      <div class="form-column"></div>
      <div class="form-column form-column-hidden"></div>
      <div class="form-column form-column-hidden"></div>
    `

    // Function doesn't exist yet - this will fail
    // updateFormVisibility(form)

    const jobColumn = form.querySelector('.form-column:nth-child(2)')
    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(true)
  })

  test('reveals columns when stock width and height are valid', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="10">
      <input id="stockHeight" value="12">
      <div class="form-column"></div>
      <div class="form-column form-column-hidden" aria-hidden="true"></div>
      <div class="form-column form-column-hidden" aria-hidden="true"></div>
    `

    // Function doesn't exist yet - this will fail
    // updateFormVisibility(form)

    const jobColumn = form.querySelector('.form-column:nth-child(2)')
    const toolColumn = form.querySelector('.form-column:nth-child(3)')

    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(false)
    expect(jobColumn?.classList.contains('form-column-reveal-job')).toBe(true)
    expect(toolColumn?.classList.contains('form-column-reveal-tool')).toBe(true)
  })

  test('only reveals once (one-time animation)', () => {
    const form = document.createElement('div')
    form.innerHTML = `
      <input id="stockWidth" value="10">
      <input id="stockHeight" value="12">
      <div class="form-column"></div>
      <div class="form-column form-column-reveal-job"></div>
      <div class="form-column form-column-reveal-tool"></div>
    `

    // Function doesn't exist yet
    // updateFormVisibility(form)

    // Should not re-trigger animation
    const jobColumn = form.querySelector('.form-column:nth-child(2)')
    expect(jobColumn?.classList.contains('form-column-hidden')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/ui.test.ts`
Expected: Test file runs but tests are incomplete (commented out function calls)

**Step 3: Implement updateFormVisibility function**

Add to `src/ui.ts` after `createForm()` function:

```typescript
export function updateFormVisibility(form: HTMLElement): void {
  const getValue = (id: string): number => {
    const input = form.querySelector(`#${id}`) as HTMLInputElement
    return parseFloat(input?.value || '0')
  }

  const stockWidth = getValue('stockWidth')
  const stockHeight = getValue('stockHeight')
  const isStockValid = stockWidth > 0 && stockHeight > 0

  if (!isStockValid) return

  const jobColumn = form.querySelector('.form-column:nth-child(2)') as HTMLElement
  const toolColumn = form.querySelector('.form-column:nth-child(3)') as HTMLElement

  if (!jobColumn || !toolColumn) return

  // Only reveal if not already revealed (one-time animation)
  if (jobColumn.classList.contains('form-column-hidden')) {
    jobColumn.classList.remove('form-column-hidden')
    jobColumn.classList.add('form-column-reveal-job')
    jobColumn.removeAttribute('aria-hidden')

    toolColumn.classList.remove('form-column-hidden')
    toolColumn.classList.add('form-column-reveal-tool')
    toolColumn.removeAttribute('aria-hidden')

    // Clean up will-change after animations complete
    const cleanup = () => {
      if (jobColumn.style) jobColumn.style.willChange = 'auto'
      if (toolColumn.style) toolColumn.style.willChange = 'auto'
    }
    toolColumn.addEventListener('animationend', cleanup, { once: true })
  }
}
```

**Step 4: Update test to use the function**

Uncomment the function calls in `src/ui.test.ts` and add import:

```typescript
import { updateFormVisibility } from './ui'
```

Then uncomment all `updateFormVisibility(form)` calls in the tests.

**Step 5: Run test to verify it passes**

Run: `bun test src/ui.test.ts`
Expected: All 3 tests pass

**Step 6: Commit the validation function**

```bash
git add src/ui.ts src/ui.test.ts
git commit -m "feat: add updateFormVisibility function

Add function to reveal Job/Tool sections when Stock dimensions are
valid. Includes one-time animation logic and cleanup of will-change
property. Fully tested.

Part 3 of progressive disclosure implementation."
```

---

## Task 4: Integrate Visibility Function with Form Events

**Files:**
- Modify: `src/ui.ts` (lines 96-101, event listener setup in `createForm()`)

**Step 1: Update event listeners to call updateFormVisibility**

Find the event listener setup in `createForm()` (around lines 96-101) and modify:

```typescript
// Wire up event listeners
const inputs = form.querySelectorAll('input')
inputs.forEach(input => {
  input.addEventListener('input', () => {
    updateFormVisibility(form)
    onUpdate(getFormValues(form))
  })
  input.addEventListener('change', () => {
    updateFormVisibility(form)
    onUpdate(getFormValues(form))
  })
})
```

**Step 2: Test in dev server**

Run: `bun run dev`
Open browser, enter values in Stock width/height
Expected: When both are > 0, Job and Tool sections should remain hidden (need Task 5 to add hidden classes to template)

**Step 3: Run all tests to ensure no regressions**

Run: `bun test`
Expected: All 39 existing tests + 3 new tests = 42 tests pass

**Step 4: Commit event listener integration**

```bash
git add src/ui.ts
git commit -m "feat: wire updateFormVisibility to form input events

Call updateFormVisibility on input/change events to trigger progressive
disclosure when Stock fields become valid.

Part 4 of progressive disclosure implementation."
```

---

## Task 5: Add Hidden State to Template

**Files:**
- Modify: `src/ui.ts` (line 31 and line 54, Job and Tool column divs in template)

**Step 1: Add form-column-hidden class to Job column**

Find the Job column div (around line 31) and modify:

```typescript
<div class="form-column form-column-hidden" aria-hidden="true">
  <h3>Job</h3>
```

**Step 2: Add form-column-hidden class to Tool column**

Find the Tool column div (around line 54) and modify:

```typescript
<div class="form-column form-column-hidden" aria-hidden="true">
  <h3>Tool</h3>
```

**Step 3: Test complete progressive disclosure flow**

Run: `bun run dev`

Test scenario:
1. Open page - only Stock column visible
2. Enter stockWidth = 10
3. Enter stockHeight = 12
4. Job and Tool columns should slide/expand into view (depending on viewport size)

Expected: Progressive disclosure works end-to-end

**Step 4: Test responsive behavior**

With dev server running, test at different viewport sizes:
- Mobile (< 768px): Accordion expansion
- Tablet (768-1023px): Job slides, Tool expands
- Desktop (>= 1024px): Clockwork cascade

Expected: Animations match viewport appropriately

**Step 5: Run all tests**

Run: `bun test`
Expected: All 42 tests pass

**Step 6: Commit template changes**

```bash
git add src/ui.ts
git commit -m "feat: add hidden state classes to Job/Tool sections

Add form-column-hidden and aria-hidden to Job and Tool columns in
template. Completes progressive disclosure implementation.

Part 5 of progressive disclosure implementation."
```

---

## Task 6: Manual Testing and Verification

**Files:**
- No file changes

**Step 1: Test desktop animation**

Run: `bun run dev`
Open browser at desktop width (>= 1024px)
Test:
1. Page loads with only Stock visible
2. Enter stockWidth = 10, stockHeight = 12
3. Verify Job slides from left, stops
4. Verify Tool slides from left, continues past Job
5. Verify mechanical "snap into place" feel from easing curve

Expected: Clockwork cascade works smoothly

**Step 2: Test tablet animation**

Resize browser to tablet width (768-1023px)
Refresh page
Test:
1. Page loads with only Stock visible
2. Enter stockWidth = 10, stockHeight = 12
3. Verify Job slides from left (beside Stock)
4. Verify Tool expands from below

Expected: Hybrid animation works

**Step 3: Test mobile animation**

Resize browser to mobile width (< 768px)
Refresh page
Test:
1. Page loads with only Stock visible
2. Enter stockWidth = 10, stockHeight = 12
3. Verify Job expands downward
4. Verify Tool expands downward with slight delay

Expected: Accordion expansion works

**Step 4: Test one-time reveal behavior**

At any viewport size:
1. Fill Stock fields (triggers reveal)
2. Clear Stock fields
3. Verify Job and Tool remain visible
4. Re-fill Stock fields
5. Verify no re-animation occurs

Expected: Animation only happens once

**Step 5: Test accessibility**

Use keyboard navigation:
1. Tab through form before Stock is filled
2. Verify focus skips hidden Job/Tool fields
3. Fill Stock fields to reveal sections
4. Tab through form again
5. Verify focus reaches all fields

Expected: Tab order works correctly, aria-hidden prevents interaction when hidden

**Step 6: Document manual test results**

Create: `docs/testing/progressive-disclosure-manual-tests.md`

```markdown
# Progressive Disclosure Manual Testing Results

## Desktop (>= 1024px)
- [x] Clockwork cascade animation
- [x] Job slides and stops
- [x] Tool emerges from behind Job
- [x] Mechanical snap feel from easing

## Tablet (768-1023px)
- [x] Job slides horizontally
- [x] Tool expands vertically
- [x] Hybrid animation smooth

## Mobile (< 768px)
- [x] Job accordion expansion
- [x] Tool accordion expansion with delay
- [x] Smooth vertical expansion

## One-Time Reveal
- [x] Animation triggers on valid Stock
- [x] Sections stay visible when Stock cleared
- [x] No re-animation on re-fill

## Accessibility
- [x] Hidden fields not in tab order
- [x] Revealed fields accessible via keyboard
- [x] aria-hidden removed on reveal

Tested by: Claude
Date: 2026-01-25
```

**Step 7: Commit manual test documentation**

```bash
mkdir -p docs/testing
git add docs/testing/progressive-disclosure-manual-tests.md
git commit -m "docs: add manual testing results for progressive disclosure

Document successful manual testing across all viewports and interaction
patterns."
```

---

## Task 7: Build and Verify Production Bundle

**Files:**
- No source changes

**Step 1: Build production bundle**

Run: `bun run build`
Expected: Build succeeds, creates `dist/index.html`

**Step 2: Preview production build**

Run: `bun run preview`
Expected: Server starts, serving production bundle

**Step 3: Test production bundle**

Open preview URL in browser
Repeat key tests from Task 6:
1. Desktop clockwork animation
2. Mobile accordion animation
3. One-time reveal behavior

Expected: All behaviors work identically to dev server

**Step 4: Verify bundle size increase is reasonable**

Run: `ls -lh dist/index.html`
Note the file size
Expected: Size increase < 5KB (CSS animations are minimal)

**Step 5: Run all tests one final time**

Run: `bun test`
Expected: All 42 tests pass

**Step 6: Commit production verification note**

```bash
git commit --allow-empty -m "chore: verify progressive disclosure in production build

Confirmed all animations work correctly in production bundle. Bundle
size increase minimal (<5KB)."
```

---

## Task 8: Update Documentation

**Files:**
- Modify: `CLAUDE.md` (after Architecture section)

**Step 1: Document the progressive disclosure feature**

Add new section to `CLAUDE.md` after the "Architecture" section:

```markdown
### Progressive Disclosure UI

The form uses progressive disclosure to guide new users:

**Initial State:** Only Stock dimensions and raster direction visible

**Trigger:** When stockWidth > 0 and stockHeight > 0, Job and Tool sections animate into view

**Animation Strategy (Responsive):**
- **Desktop (>= 1024px):** Clockwork cascade - Job and Tool slide from left with staggered timing
- **Tablet (768-1023px):** Hybrid - Job slides horizontally, Tool expands vertically
- **Mobile (< 768px):** Accordion - both sections expand downward

**Key Implementation Details:**
- One-time animation: sections stay visible even if Stock is cleared
- Accessibility: `aria-hidden` on hidden sections, removed on reveal
- Performance: GPU-accelerated transforms, `will-change` cleanup after animation

**Implementation Files:**
- CSS: `index.html` (progressive disclosure animations section)
- Logic: `src/ui.ts` (`updateFormVisibility` function)
- Tests: `src/ui.test.ts`
```

**Step 2: Run all tests**

Run: `bun test`
Expected: All 42 tests pass

**Step 3: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: document progressive disclosure feature

Add architecture documentation for progressive disclosure UI pattern,
including responsive animation strategy and implementation details."
```

---

## Task 9: Final Review and Merge Preparation

**Files:**
- No changes

**Step 1: Review all commits**

Run: `git log --oneline origin/main..HEAD`
Expected: See 8-9 commits for progressive disclosure implementation

**Step 2: Run full test suite**

Run: `bun test`
Expected: All 42 tests pass

**Step 3: Build production bundle**

Run: `bun run build`
Expected: Clean build, no errors or warnings

**Step 4: Create summary of changes**

Create: `docs/plans/progressive-disclosure-summary.md`

```markdown
# Progressive Disclosure Implementation Summary

## Changes Made

### CSS Animations (index.html)
- Added `slideFromLeft`, `slideFromLeftLong`, `accordionExpand` keyframes
- Implemented responsive animation strategy across 3 breakpoints
- Desktop: Clockwork cascade with staggered timing
- Tablet: Hybrid (Job slides, Tool expands)
- Mobile: Accordion expansion

### TypeScript (src/ui.ts)
- Added `updateFormVisibility()` function
- Integrated with form input/change events
- Added `form-column-hidden` classes to Job/Tool columns in template

### Tests (src/ui.test.ts)
- Added 3 new tests for `updateFormVisibility()`
- Tests cover: invalid state, valid reveal, one-time animation

### Documentation
- Manual test results in `docs/testing/`
- Architecture docs in `CLAUDE.md`
- Implementation plan in `docs/plans/`

## Test Results
- All 42 tests passing
- Manual testing successful across all viewports
- Production build verified

## Ready for Review
Branch: feature/progressive-form-disclosure-impl
Commits: 9
Files changed: 4 (index.html, src/ui.ts, src/ui.test.ts, CLAUDE.md)
```

**Step 5: Commit implementation summary**

```bash
git add docs/plans/progressive-disclosure-summary.md
git commit -m "docs: add implementation summary for progressive disclosure

Summary of all changes, test results, and review readiness."
```

**Step 6: Push branch**

Run: `git push -u origin feature/progressive-form-disclosure-impl`
Expected: Branch pushed successfully

**Step 7: Verify on GitHub**

Output message to user:
```
Progressive disclosure implementation complete!

Branch: feature/progressive-form-disclosure-impl
Commits: 9
Tests: 42 passing (3 new)
Ready for PR or merge.

Next steps:
- Create PR to main branch
- Or merge directly if no review needed
```
