# Group invoice items by encounter type

## Invoice table layout

With split encounters the invoice table gains a header row per encounter type (with its own Insurance plan button) and an Add item row per group, so it needs to stay within the invoice pane at common laptop widths (1440px) rather than scrolling sideways. The split encounter invoice mockup shows the approach:

- The price breakdown under an item's cost (item discount, price after discount, insurance plan lines) should not widen the Cost column. Its labels extend left under Ordered by, which is empty on those lines. In the mockup this is `contain: inline-size` on the breakdown rows in `PriceCell.jsx`
- Each column's minimum width (`CELL_WIDTHS` in `features/Invoice/constants.js`) gives way when the table is narrower than the minimums add up to. Wide screens keep today's widths. In the mockup the table wrapper is a size container and each minimum is `min(<current em>, <share of the table width>)`
- The invoice card keeps its 750px minimum. Below that the pane still scrolls sideways, as the Patient payments section has fixed-width columns too
