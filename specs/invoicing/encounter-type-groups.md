---
id: INVGRP
---

# Invoice encounter type groups

An encounter can move between encounter categories part way through, for example a patient who arrives through triage and is then admitted to hospital. With invoice splitting turned on, the encounter's invoice groups its items by the category the patient was in, so staff and patients can see which part of the stay each charge belongs to.

## Setting

Grouping is a display rule read from the setting as it currently stands, and a facility sets it once when the deployment is configured.

- [ ] Grouping is controlled by the global Split invoice by encounter type setting, in the Invoice category, which is off by default.
- [ ] With the setting off, every invoice shows its items without group headers.
- [ ] Every invoice follows the setting as it currently stands, finalised invoices included.

## Groups

- [ ] Groups follow the encounter categories: Outpatient, Emergency and Inpatient (see `invoicing/encounter-fees.md`). Triage, Active ED care and Emergency short stay all fall in the Emergency group.
- [ ] A group's period runs from when the encounter entered that category until it moved to another category, or until the encounter ended. A period that is still running ends today.
- [ ] Every boundary between groups is an admission, so it falls at the admission date and time entered on the move rather than at the time the move was recorded.
- [ ] The day a patient moves falls within both the ending group's period and the starting group's, because an item carries a date and not a time.
- [ ] Vaccination and form response encounters are never grouped.
- [ ] An item added automatically is recorded against the group for the category the encounter is in when the item is added, so the emergency fee sits in the Emergency group and bed fees in the Inpatient group (see `invoicing/encounter-fees.md`).
- [ ] An item added manually is recorded against the group it was added from.
- [ ] Changing an item's date never moves it to another group. An item is moved between groups by deleting it and adding it again from the other group.
- [ ] An item whose date falls outside its group's period, because the admission time was corrected after the item was added, stays in its group and is listed at the date it holds.

## Grouped invoice

- [ ] An invoice for an encounter that has only ever been in one category shows its items without group headers.
- [ ] An invoice for an encounter that has moved between categories shows one group per period, in date order, including periods with no items.
- [ ] Each group opens with a header row showing the category name and the period's date range.
- [ ] The date range of a period that is still running reads as its start date followed by "Current".
- [ ] Each group header is marked with the colour its category's encounter types carry in the encounter view, Outpatient carrying the clinic colour.
- [ ] Invoice-wide actions sit in a single overflow menu for the invoice; a group header carries no actions of its own.
- [ ] Each group ends with its own Add item action. A group whose period holds no items shows its header and that action alone.
- [ ] Invoice totals cover every group.
- [ ] The invoice summary covers the whole invoice, groups included.

## Adding and editing items

- [ ] A group's Add item opens the Add items window for that group, naming its category and date range.
- [ ] The Edit invoice window groups items the same way as the invoice, each group opening with its header row.
- [ ] A group's date picker only offers dates within that group's period, so an item cannot be given a date belonging to another group.
- [ ] In a group whose period has ended, a new item's date starts empty.
- [ ] In the group for the current period, a new item's date starts at today and can be backdated as far as the group's start, which on an encounter that has never moved is the encounter's start.
- [ ] Editing an item's date in the Edit invoice window follows the same limits as the group it belongs to, so an item dated outside its group's period is brought back inside the period when it is saved.
- [ ] A date typed outside the allowed range shows an inline error giving the first and last allowed dates, and the items cannot be saved until it is corrected.

