# Group invoice items by encounter type

## Invoice table layout

With split encounters the invoice table gains a header row per encounter type (with its own Insurance plan button) and an Add item row per group, so it needs to stay within the invoice pane at common laptop widths (1440px) rather than scrolling sideways. The split encounter invoice mockup shows the approach:

- The price breakdown under an item's cost (item discount, price after discount, insurance plan lines) should not widen the Cost column. Its labels extend left under Ordered by, which is empty on those lines. In the mockup this is `contain: inline-size` on the breakdown rows in `PriceCell.jsx`
- Each column's minimum width (`CELL_WIDTHS` in `features/Invoice/constants.js`) gives way when the table is narrower than the minimums add up to. Wide screens keep today's widths. In the mockup the table wrapper is a size container and each minimum is `min(<current em>, <share of the table width>)`
- The invoice card keeps its 750px minimum. Below that the pane still scrolls sideways, as the Patient payments section has fixed-width columns too

## Scope

- This card covers the on-screen invoice: grouping, the Add items and Edit invoice windows, per-group insurance plans, and the Split invoice by encounter type setting
- The printed invoice is covered by separate work
- Splitting insurer payments and balances by group is covered by a separate ticket, so this card leaves the insurer payments table invoice-wide. Only the per-group insurance coverage lines in the invoice summary come from here
- Tech design is still to come. Open questions for it: how an item records its group, and where per-group insurance plans are stored

## Group boundaries

Every category crossing is an admission, so a boundary is the Admission date & time entered on the move. Two traps in the encounter code:

- `MoveModal.jsx` sends `submittedTime: getCurrentDateTime()`, and `EncounterHistory.createSnapshot` stamps the history row with that — the time the move was *recorded*, not the admission time the clinician entered. The history row's `date` is therefore the wrong source for a boundary
- The same submit writes the entered admission time onto `encounter.startDate`, overwriting the original check-in time. The first group's start has to come from the first `encounter_history` row, not from `encounter.startDate`. The same applies to the "backdate as far as the encounter's start" limit on the current group

The admission time stays editable afterwards (`EncounterForm.jsx` disables `encounterType` but not `startDate`), so a boundary can move under items that are already placed. Items keep the group they were recorded against; only the displayed period moves.

## Setting

Grouping reads the setting at display time, with nothing recorded per invoice about how it was created. Items and insurance plans are recorded against a group either way, so an invoice groups and ungroups without rework. The setting is expected to be configured once per deployment, so the switch-over case is not designed for.
