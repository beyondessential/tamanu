---
id: INVGRP
---

# Invoice encounter type groups

An encounter can move between encounter families part way through, for example a patient who arrives through triage and is then admitted to hospital. With invoice splitting turned on, the encounter's invoice groups its items by the family the patient was in, so staff and patients can see which part of the stay each charge belongs to. Each group also carries its own insurance plans and insurer balances.

## Setting

- [ ] Grouping is controlled by the global Split invoice by encounter type setting, in the Invoice category, which is off by default.
- [ ] With the setting off, every invoice shows its items without group headers and its insurance plans apply to the whole invoice.
- [ ] An invoice created before the setting was turned on keeps that ungrouped layout, including once it is finalised.

## Groups

- [ ] Groups follow the encounter families: Outpatient, Emergency and Inpatient (see `invoicing/encounter-fees.md`). Triage, Active ED care and Emergency short stay all fall in the Emergency group.
- [ ] A group's period runs from when the encounter entered that family until it moved to another family, or until the encounter ended. A period that is still running ends today.
- [ ] Vaccination and form response encounters are never grouped.
- [ ] An item added automatically is recorded against the group for the family the encounter is in when the item is added.
- [ ] An item added manually is recorded against the group it was added from.
- [ ] Changing an item's date never moves it to another group.
- [ ] Bed fees batch by location within a group, so a batch never spans two groups.

## Grouped invoice

- [ ] An invoice for an encounter that has only ever been in one family shows its items without group headers.
- [ ] An invoice for an encounter that has moved between families shows one group per period, in date order, including periods with no items.
- [ ] Each group opens with a header row showing the family name and the period's date range.
- [ ] The date range of a period that is still running reads as its start date followed by "Current".
- [ ] Each group header is marked with the colour that group's encounter types carry elsewhere in the encounter view.
- [ ] Invoice-wide actions sit in a single overflow menu for the invoice. Each group header carries only its own Insurance plan action.
- [ ] Each group ends with its own Add item action.
- [ ] Invoice totals cover every group.
- [ ] The invoice summary on a grouped invoice shows one insurance coverage line per group, each reading "Insurance coverage" followed by the family name in brackets, for example "Insurance coverage (Emergency)".

## Adding and editing items

- [ ] A group's Add item opens the Add items window for that group, naming its family and date range.
- [ ] The Edit invoice window groups items the same way as the invoice, each group with its own Add item.
- [ ] In a group whose period has ended, a new item's date starts empty and the date picker only offers dates within that period.
- [ ] In the group for the current period, a new item's date starts at today, and can be backdated as far as the encounter's start.
- [ ] Editing an item's date in the Edit invoice window follows the same limits as the group it belongs to.
- [ ] A date typed outside the allowed range shows an inline error giving the first and last allowed dates, and the items cannot be saved until it is corrected.

## Insurance plans by period

- [ ] The insurance plans window opened from a group names that group's family and shows the plans already set on it.
- [ ] An item's insurance coverage comes from the plans set on its group.
- [ ] When an encounter first moves to another family, the plans already set on the invoice stay with the first group.
- [ ] A group for a new period starts with no insurance plans.

## Insurer payments

- [ ] An insurer payment is recorded against one group.
- [ ] Each insurer's amount due, payments and remaining balance are shown per group.
