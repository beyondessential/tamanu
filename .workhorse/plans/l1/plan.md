# Group invoice items by encounter type

## Invoice table layout

With split encounters the invoice table gains a header row per encounter type and an Add item row per group, so it needs to stay within the invoice pane at common laptop widths (1440px) rather than scrolling sideways. The split encounter invoice mockup shows the approach:

- The price breakdown under an item's cost (item discount, price after discount, insurance plan lines) should not widen the Cost column. Its labels extend left under Ordered by, which is empty on those lines. In the mockup this is `contain: inline-size` on the breakdown rows in `PriceCell.jsx`
- Each column's minimum width (`CELL_WIDTHS` in `features/Invoice/constants.js`) gives way when the table is narrower than the minimums add up to. Wide screens keep today's widths. In the mockup the table wrapper is a size container and each minimum is `min(<current em>, <share of the table width>)`
- The invoice card keeps its 750px minimum. Below that the pane still scrolls sideways, as the Patient payments section has fixed-width columns too

## Scope

- The printed invoice is covered by separate work
- Insurance is out of scope entirely: per-group plans, per-group coverage lines and insurer balances all belong to the upcoming insurance card. This card leaves the Insurance plan action, the coverage line and the insurer payments table invoice-wide, exactly as they are today
- What is left here is the grouped display of items: group headers, per-group Add item, the grouped Edit invoice window, the per-group date limits, and the setting

## Setting

Grouping reads the setting at display time, with nothing recorded per invoice about how it was created, so an invoice groups and ungroups without rework. The setting is expected to be configured once per deployment, so the switch-over case is not designed for.

## Grouping data model

Still to be designed. Two things have to be decided together, because the second depends on how cheap the first is.

### Where a group's period comes from

Three candidates, in rising cost:

- **Derive from the encounter row.** The Inpatient period starts at `encounter.startDate`, because admitting overwrites it with the entered admission time, and the earlier period starts at the first `encounter_history` row, which `Encounter.create` stamps with the original check-in and never rewrites. No migration and no history scan. It is correct only while admission is the only category crossing, and it fails silently rather than loudly if that stops being true
- **Read the changelog.** `logs.changes` holds whole `record_data` snapshots, so it carries encounter type and start date *together* at each revision — the one source that has both. `encounter_history` records the type but not the start date, which is why it cannot answer this on its own. Filtering is `record_id = <encounter id>`, an equality the facility hash index serves, so the read is bounded to one encounter. Against it: `coding-rules.md` wants a stated reason for any `logs.changes` read on a page-load path and prefers adding a column, and the changelog is the largest table on most deployments and is never pruned on facility servers
- **Record the boundary ourselves.** Store the admission time on the invoice, or on a group record, when the move happens. One domain column, no history or changelog read on page load, and it is unaffected by later changes to how encounters record moves. Needs a backfill for encounters that have already moved

Note for whichever is chosen: `EncounterHistory.createSnapshot` stamps a move with `submittedTime`, which `MoveModal.jsx` sets to `getCurrentDateTime()` — when the move was *recorded*, not when it happened. So `encounter_history.date` is the wrong column for a boundary regardless. The admission time also stays editable afterwards (`EncounterForm.jsx` disables `encounterType` but not `startDate`), so any derived boundary can move under items already placed.

`encounter_history` is worth checking before relying on it. It looks live rather than deprecated — written by `Encounter.update`, indexed on `encounter_id` by migration `1790641714000`, and backfilled from historical system notes by the central-server `changelogToEncounterHistory` data migration — but that should be confirmed with whoever knows the deprecation plan.

### Whether an item stores its group or derives it

Storing means a column on `invoice_items` set when the item is added, holding either the encounter type (lossless, category derived from it) or the category directly. Deriving means working the group out from the item's `orderDate` against the periods, with no new column.

Deriving is cheaper but contradicts three criteria in `invoicing/encounter-type-groups.md`, so choosing it means revising the spec:

- Changing an item's date would move it between groups, which the spec says never happens
- A corrected admission time would re-sort items already placed, where the spec has them stay put
- Items carry a date and not a time, so an item dated on the move day falls in both periods and needs a tiebreak rule. This is the refinement question the card was raised with

If the group is stored, existing invoice items need a one-off backfill, which can itself derive from dates since it runs once.

### Other things the build touches

- `getItemTotalInsuranceCoverageAmount` reads `item.insurancePlanItems`, filled from `GET invoices/insurance-plan-items?encounterId&productId`. Nothing here changes while insurance stays invoice-wide
- The setting sits with its siblings at `features.invoicing` in `packages/settings/src/schema/global.ts`, exposed to web. The spec calls it the Invoice category, which is worth reconciling with how `features.invoicing` is presented in the admin panel
- Invoicing has no mobile models, so there is no TypeORM migration to pair with a server one
- Any schema change needs the dbt source models under `database/model/` regenerated, and DDL kept out of the same migration as DML
