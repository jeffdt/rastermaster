# Confirm raster pattern snakes back and forth
It appears as though it might move left to right, then retract and rapid to the next line, then move right to left, then retract and rapid to the next line, etc. Instead, it should move left to right, then rapid to the next line, then move right to left, then rapid to the next line, etc. It should not retract until it has finished the entire pattern and is ready to begin the next pass. 

# Dynamic Layout
Dynamic layout: switch form/preview orientation based on raster direction (X-axis: form top/preview bottom, Y-axis: form left/preview right with animations)

# Fudge factor
User needs to be able to add a fudge factor to the stock dimensions to account for stock that's misaligned, mismeasured, or misshapen. I am imagining a percentage that defaults to 5%. The fudged dimensions should be used for layout and overhang. Maybe we could display it in the preview as well, in a different color than the stock?

# Remove up/down numeric stepper buttons
The up/down buttons feel pointless on most numeric inputs. I think the user should just be expected to type in the value they want. Ask me which ones we should keep.

# Preview missing edge steps
The preview doesn't show the steps between raster lines (or if it does, they're hidden behind the dotted lines at the borders). Ask me for a screenshot when we work on this item, I'll show you what I mean.

# Allow fractions for dimensions
I'm not sure how to handle this on the UI, but being able to enter 15/16 instead of having to calculate it as 0.9375 would reduce friction between taking measurements and generating toolpaths.

# Investigate erroneous red input boxes
Some of the input boxes are red with the default values. Depth of pass=0.01, Feed rate=125, Safe Z=0.125

# Save Tool settings to local storage
For future sessions.

# Add buttons next to each field to reset to default value

# Save/Load Project (json) buttons

# New (Reset All) button

# Add special color, icon or flag for local dev

# Add a favicon

# When you open a new project, only display dimensions + raster direction. Once you enter those, the rest of the form should animate in to the right.