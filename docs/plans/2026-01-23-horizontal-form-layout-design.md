# Horizontal Form Layout Design

## Overview

Reorganize the UI from a side-by-side layout (form left, preview right) to a stacked layout (form top, preview bottom). This maximizes horizontal space for the preview, which is critical since most surfacing jobs run in the X-axis direction and produce wide, shallow toolpaths.

Additionally, reorganize form fields into three logical groups that match the user's workflow: Stock & Layout → Surfacing Details → Tool & Speeds.

## Motivation

The current side-by-side layout splits available width 50/50 between form and preview. For X-axis raster operations (the most common case), the toolpath is wide and shallow, making the vertical preview space underutilized while the horizontal space is constrained.

The current form organization groups fields by technical category (Stock Dimensions, Tool Settings, Toolpath, Speeds & Feeds) rather than by user workflow, which doesn't match how the user thinks about configuring a surfacing job.

## Layout Structure

### Page Layout
- **Form area** spans full width at top
- **Preview area** spans full width below form
- **Generate GCode button** positioned below preview

### Form Layout
Three equal-width columns arranged horizontally with subtle visual separation (light vertical divider lines and section headings):

1. **Stock** - Physical setup (what's on the machine)
2. **Job** - Operation parameters (how you're cutting)
3. **Tool** - Machine configuration (settings to verify before running)

## Column Contents

### Column 1: Stock
- Stock Width (number input, "in")
- Stock Height (number input, "in")
- Raster Direction (radio buttons: X-axis, Y-axis)

### Column 2: Job
- Skim pass (Z=0 first) - checkbox
- Number of Passes - number input
- Depth per Pass (number input, "in")
- Pause every _ passes (number input, 0 = disabled)

### Column 3: Tool
- Bit Diameter (number input, "in")
- Stepover (number input, "%")
- Feed Rate (number input, "in/min")
- Plunge Rate (number input, "in/min")
- Spindle RPM (number input)
- Safe Z (number input, "in")

## UI Changes

### Pause Between Passes
Remove the "Pause between passes" checkbox. Always show the interval field with the label "Pause every _ passes". A value of 0 means no pauses (no M0 commands generated). This simplifies the UI by removing conditional field visibility.

### Preview Area
- Spans full viewport width below form
- Maintains all current features: auto-scaling, stock boundary, overhang visualization, raster lines, start point marker
- Aspect ratio adjusts naturally based on stock dimensions and raster direction
- Height can increase since we're no longer constrained by side-by-side layout

### Visual Treatment
- Three columns have equal width (CSS Grid: `1fr 1fr 1fr`)
- Subtle vertical dividers between columns (light borders)
- Section headings for each column
- All individual field styles remain unchanged
- Field tabbing order flows left-to-right, top-to-bottom through columns

## Implementation Notes

### HTML/CSS Changes
- Main layout container shifts from two-column to vertical stack
- Form uses CSS Grid with three equal columns
- Preview container takes full width
- No responsive design needed (minimum 1080p screen)

### ui.ts Changes
- `createForm()` restructured to generate three column containers
- Remove "Pause between passes" checkbox
- Change pause interval field label to "Pause every _ passes"
- Always show pause interval field (no conditional visibility)

### No Changes Needed
- Validation logic (validateParams, isFormValid)
- Data extraction (getFormValues)
- Core modules (toolpath.ts, gcode.ts, preview.ts)
- Type definitions (except removing pause checkbox if it exists as separate field)
- Default values and calculations

## Data Flow & Behavior

### Unchanged
- Form validation (required fields, value ranges)
- Live preview regeneration on any input change
- GCode generation process
- All default values and calculations

### Changed
- Pause interval value of 0 disables pauses (instead of checkbox)
- Preview utilizes full width instead of half width

## Future Enhancements

Dynamic layout switching: When Y-axis raster direction is selected, rotate layout to form left/preview right (with CSS animations). This would optimize vertical space for Y-axis rasters. Captured in TODO for future implementation.
