# Dynamic Layout
Dynamic layout: switch form/preview orientation based on raster direction (X-axis: form top/preview bottom, Y-axis: form left/preview right with animations)

# Fudge factor
User needs to be able to add a fudge factor to the stock dimensions to account for stock that's misaligned, mismeasured, or misshapen. I am imagining a percentage that defaults to 5%. The fudged dimensions should be used for layout and overhang. Maybe we could display it in the preview as well, in a different color than the stock?

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

# Add special color, icon or flag for local dev

# Rename "Safe Z" to "Retract Height"

# Bug: Raster background trail effect disappears after about 18-19 lines.
Instead of making it go to screen bottom, I'd like it to do about 4 lines total before reversing direction and going back up to the top. That way, it will mostly be behind the h1 title. This isolates the effect to the top of the screen and reduces noise in the workspace.

# Bug: Look at rasters with a height like 3.9. There's an additional raster line at the top that shouldn't be there.

# Does the filename need an extension filetype?

# The number stepper buttons are too close to the input boxes. Ask me for a screenshot.

# Toggle between X-Axis and Y-Axis should be animated (squeeze and slide, bounce, whatever. something fun.)

# Bug: On Mobile, the stock does not appear in the preview window after dimensions are entered. Once I toggle between X-Axis and Y-Axis, the stock appears.