# Dynamic Layout
Dynamic layout: switch form/preview orientation based on raster direction (X-axis: form top/preview bottom, Y-axis: form left/preview right with animations)

# Allow fractions for dimensions
I'm not sure how to handle this on the UI, but being able to enter 15/16 instead of having to calculate it as 0.9375 would reduce friction between taking measurements and generating toolpaths.

# Investigate erroneous red input boxes
Some of the input boxes are red with the default values. Depth of pass=0.01, Feed rate=125, Safe Z=0.125

# Save Tool settings to local storage
For future sessions.

# Add buttons next to each field to reset to default value

# Save/Load Project (json) buttons

# New/Reset All button
Resets all fields to default values. Does not repeat the animation.

# Swap colors when in local dev
Instead of orange title, raster effect and input fields, use green when doing local dev.

# Bug: Look at rasters with a height like 3.9. There's an additional raster line at the top that shouldn't be there. Or maybe it should just be spaced at the normal stepover spacing instead of calculating special spacing for the final line. Help me reason through this.

# Bug: On Mobile, the stock does not appear in the preview window after dimensions are entered. Once I toggle between X-Axis and Y-Axis, the stock appears.

# Stock dimensions in preview should appear above all other elements.

# For the raster effect trail, maybe it could be implemented as additional copies of the main effect, staggered back in time and increasingly faded out. What do you think?

# Stock section shrinks once you enter dimensions. It should stay the same size.
