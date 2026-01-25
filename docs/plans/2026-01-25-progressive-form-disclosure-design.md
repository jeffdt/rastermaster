# Progressive Form Disclosure Design

## Overview

Transform the RasterMaster form from showing all parameters at once to a progressive disclosure pattern. On initial load, only Stock dimensions and raster direction are visible. Once valid dimensions are entered, the Job and Tool sections animate into view with a mechanical, clockwork-inspired effect.

**Design Goal:** Guide new users to the essential fields first while creating an industrial, puzzle-box feel that matches the CNC machining context.

**Key Principle:** This is an onboarding pattern, not a validation gate. Once revealed, sections stay visible even if Stock fields are cleared. The animation teaches the interface structure on first use.

## Component Structure & State Management

### Current State
The form is a single `createForm()` function generating all three columns at once with staggered fade-in animations.

### New Approach
Keep the single-function approach but add conditional rendering based on validation state. The form tracks whether Stock is valid and uses that to control visibility and animation classes.

### State Flow
1. **Initial render:** Only Stock column visible
2. **User input:** Fills stockWidth and stockHeight
3. **Validation check:** On each input event, check if both values > 0
4. **Trigger reveal:** When valid, add animation classes to Job and Tool columns
5. **One-time animation:** Once revealed, columns stay visible permanently (no hide/show cycles)

### DOM Structure
```html
<div class="form-grid">
  <div class="form-column">
    <!-- Stock: always visible -->
  </div>
  <div class="form-column form-column-hidden">
    <!-- Job: starts hidden -->
  </div>
  <div class="form-column form-column-hidden">
    <!-- Tool: starts hidden -->
  </div>
</div>
```

When Stock becomes valid:
- Remove `form-column-hidden` class
- Add `form-column-reveal-job` to Job column
- Add `form-column-reveal-tool` to Tool column

## CSS Animation Design (The Clockwork Slide)

### Desktop Animation (3-column layout)

**Hidden State** (`.form-column-hidden`):
```css
.form-column-hidden {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
  position: absolute;
  will-change: transform, opacity;
  aria-hidden: true;
}
```

**Job Column Reveal** (`.form-column-reveal-job`):
- Slides from `translateX(-100%)` to `translateX(0)`
- Duration: 0.6s
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` - slight overshoot for mechanical snap
- Opacity: 0 → 1 over first 0.3s
- Z-index: Higher than Tool (stacks in front during animation)

**Tool Column Reveal** (`.form-column-reveal-tool`):
- Starts: `translateX(-100%)`
- Slides further to final position (appears to emerge from behind Job)
- Duration: 0.8s (longer travel time)
- Delay: 0.1s (creates stacked slide effect)
- Same easing curve as Job
- Z-index: Lower than Job during animation

**The Stacking Illusion:**
Both columns start at the same off-screen position. They slide together, but Job stops first while Tool continues. The z-index layering and timing difference create the appearance that Tool is sliding out from behind Job.

### Animation Performance
- Use `transform` and `opacity` only (GPU-accelerated)
- Add `will-change: transform, opacity` to hidden columns
- Remove `will-change` after animation completes via `animationend` event

## Responsive Animation Strategy

### Media Query Breakpoints
- **Mobile:** `max-width: 767px` (1 column)
- **Tablet:** `768px - 1023px` (2 columns)
- **Desktop:** `min-width: 1024px` (3 columns)

### Mobile Animation (1-column stack)
**Accordion-style expansion:**
```css
@media (max-width: 767px) {
  .form-column-hidden {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transform: none;
    position: static;
  }

  .form-column-reveal-job {
    animation: accordionExpand 0.5s ease-out;
  }

  .form-column-reveal-tool {
    animation: accordionExpand 0.5s ease-out 0.1s;
  }
}

@keyframes accordionExpand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 500px; /* Large enough for content */
    opacity: 1;
  }
}
```

Both Job and Tool expand downward with 0.1s stagger on Tool.

### Tablet Animation (2-column grid)
**Hybrid approach:**
```css
@media (min-width: 768px) and (max-width: 1023px) {
  /* Job slides horizontally (beside Stock) */
  .form-column-reveal-job {
    animation: slideFromLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Tool expands vertically (below Stock/Job) */
  .form-column-reveal-tool {
    animation: accordionExpand 0.5s ease-out 0.2s;
  }
}
```

Job gets horizontal slide (it's beside Stock), Tool uses accordion expansion (it's on the next row).

### Desktop Animation (3-column grid)
Full clockwork cascade as described in "CSS Animation Design" section above.

## JavaScript Implementation

### Validation Trigger Function
Add to `ui.ts`:

```typescript
function updateFormVisibility(form: HTMLElement): void {
  const params = getFormValues(form)
  const isStockValid =
    params.stockWidth !== undefined && params.stockWidth > 0 &&
    params.stockHeight !== undefined && params.stockHeight > 0

  if (!isStockValid) return

  const jobColumn = form.querySelector('.form-column:nth-child(2)') as HTMLElement
  const toolColumn = form.querySelector('.form-column:nth-child(3)') as HTMLElement

  // Only reveal if not already revealed (one-time animation)
  if (jobColumn?.classList.contains('form-column-hidden')) {
    jobColumn.classList.remove('form-column-hidden')
    jobColumn.classList.add('form-column-reveal-job')
    jobColumn.removeAttribute('aria-hidden')

    toolColumn.classList.remove('form-column-hidden')
    toolColumn.classList.add('form-column-reveal-tool')
    toolColumn.removeAttribute('aria-hidden')

    // Clean up will-change after animations complete
    const cleanup = () => {
      jobColumn.style.willChange = 'auto'
      toolColumn.style.willChange = 'auto'
    }
    toolColumn.addEventListener('animationend', cleanup, { once: true })
  }
}
```

### Integration with createForm()
Modify the event listener setup:

```typescript
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

### Initial Template Update
Add `form-column-hidden` to Job and Tool columns in the HTML template string:

```typescript
<div class="form-column form-column-hidden" aria-hidden="true">
  <h3>Job</h3>
  <!-- ... -->
</div>

<div class="form-column form-column-hidden" aria-hidden="true">
  <h3>Tool</h3>
  <!-- ... -->
</div>
```

## Polish & Edge Cases

### Initial Page Load
On first visit, only Stock column visible with:
- Width/height inputs (empty)
- Direction radio buttons (X-axis pre-selected)
- Clean, focused entry point

### Grid Layout During Hidden State
Desktop grid stays `grid-template-columns: repeat(3, 1fr)` throughout. Hidden columns use `position: absolute` so they don't affect layout until revealed, then switch to `position: static` during animation.

### Accessibility
- Hidden columns: `aria-hidden="true"` + `pointer-events: none`
- Once revealed: Remove `aria-hidden`, restore pointer events
- Tab order naturally follows DOM order (hidden fields are not in tab order)

### Preview Behavior
No changes needed. Preview already shows placeholder text when Stock is invalid. Once Stock is valid and Job/Tool animate in, preview updates normally as user fills additional fields.

### Animation Cleanup
Remove `will-change` property after animations complete to free up GPU resources:

```typescript
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto'
}, { once: true })
```

### One-Time Reveal Logic
Classes are added but never removed. Once the user sees the full form, it stays visible even if they clear Stock fields. This prevents:
- Jarring hide/show cycles
- Loss of user input in Job/Tool fields
- Confusion about why sections disappear

The progressive disclosure serves as first-run onboarding, not ongoing validation.

## Implementation Checklist

- [ ] Add `.form-column-hidden` CSS class with mobile/tablet/desktop variants
- [ ] Add `.form-column-reveal-job` animation class with responsive variants
- [ ] Add `.form-column-reveal-tool` animation class with responsive variants
- [ ] Define `@keyframes` for slideFromLeft, slideFromLeftLong, accordionExpand
- [ ] Add `form-column-hidden` class to Job/Tool columns in HTML template
- [ ] Add `aria-hidden="true"` to hidden columns in template
- [ ] Create `updateFormVisibility()` function in ui.ts
- [ ] Wire up `updateFormVisibility()` to input event listeners
- [ ] Add animation cleanup handler for `will-change` removal
- [ ] Test on mobile (accordion expansion)
- [ ] Test on tablet (hybrid slide + accordion)
- [ ] Test on desktop (clockwork cascade)
- [ ] Verify one-time reveal behavior
- [ ] Verify accessibility (screen reader, keyboard navigation)
