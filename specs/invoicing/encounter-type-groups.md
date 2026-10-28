---
id: INVGRP
---

# Invoice encounter type groups

An encounter can change encounter type part way through, for example a patient who arrives through triage and is then admitted to hospital. Once that happens, the encounter's invoice groups its items by the encounter type the patient was in, so staff and patients can see which part of the stay each charge belongs to. Each group also carries its own insurance plans.

## Encounter type periods

- [ ] An encounter type period runs from when the encounter took on that encounter type until it changed to another, or until the encounter ended.
- [ ] Each period is its own group, so an encounter that returns to an encounter type it had earlier has a separate group for each time.
- [ ] An invoice item belongs to the period that covers its date.

## Grouped invoice

- [ ] An invoice for an encounter that has only ever had one encounter type shows its items without group headers.
- [ ] An invoice for an encounter that has changed encounter type shows one group per period, in date order, including periods with no items.
- [ ] Each group opens with a header row showing the encounter type's name and the period's date range.
- [ ] The date range of a period that is still running reads as its start date followed by "Current".
- [ ] Each group header is marked with the colour that encounter type carries elsewhere in the encounter view.
- [ ] Each group ends with its own Add item action.
- [ ] Add item in the group for the current period starts the item's date at today; Add item in a group whose period has ended leaves the date empty for staff to enter.
- [ ] Invoice totals cover every group.
- [ ] The invoice summary shows insurance coverage as one line per period, labelled with its encounter type, in place of a single coverage total.

## Insurance plans by period

- [ ] On a grouped invoice, each group has its own Insurance plan action in its header, in place of the one in the invoice header.
- [ ] The insurance plans window opened from a group names that group's encounter type and shows the plans already set on it.
- [ ] An item's insurance coverage comes from the plans set on its group.
- [ ] When an encounter first changes encounter type, the plans already set on the invoice stay with the first group.
- [ ] A group for a new period starts with no insurance plans.

## Printed invoice

- [ ] The printed invoice groups items the same way as the invoice on screen, each group headed by its encounter type and date range.
- [ ] The printed invoice for an encounter that has only ever had one encounter type shows its items without group headings.
