# Dynamic Layout
Dynamic layout: switch form/preview orientation based on raster direction (X-axis: form top/preview bottom, Y-axis: form left/preview right with animations)

# ~~Dimension Display~~
✅ COMPLETED: The preview now displays stock dimensions as simple text labels inside the stock boundary (width centered on bottom edge, height centered on left edge).

# GitHub page deployment
I want to deploy this to a github page. I already have one available at jeffdt.com. Is it possible to map a github page to a subdomain, like rastermaster.jeffdt.com? Or does it have to be the main domain?

# Fudge factor
User needs to be able to add a fudge factor to the stock dimensions to account for stock that's misaligned, mismeasured, or misshapen. I am imagining a percentage that defaults to 5%. The fudged dimensions should be used for layout and overhang. Maybe we could display it in the preview as well, in a different color than the stock?

# Remove up/down numeric stepper buttons
The up/down buttons feel pointless on most numeric inputs. I think the user should just be expected to type in the value they want. Ask me which ones we should keep.

# Preview missing edge steps
The preview doesn't show the steps between raster lines (or if it does, they're hidden behind the dotted lines at the borders). Ask me for a screenshot when we work on this item, I'll show you what I mean.

# Allow fractions for dimensions
I'm not sure how to handle this on the UI, but being able to enter 15/16 instead of having to calculate it as 0.9375 would reduce friction between taking measurements and generating toolpaths.