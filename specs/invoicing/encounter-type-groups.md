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
- [ ] A group's Add item opens the Add items window for that group, naming its encounter type and date range.
- [ ] Add item in the group for the current period starts the item's date at today; Add item in a group whose period has ended leaves the date empty for staff to enter.
- [ ] The date picker in that window only offers dates within the group's period. The current period runs up to today.
- [ ] A date typed outside the group's period shows an inline error giving the period's first and last dates, and the items cannot be saved until it is corrected.
- [ ] Saved items appear in the group they were added from.
- [ ] Invoice totals cover every group.
- [ ] The invoice summary shows insurance coverage as one line per encounter family (Outpatient, Emergency, Inpatient; see `invoicing/encounter-fees.md`), in place of a single coverage total. Each line reads "Insurance coverage" followed by the family in brackets, and totals the coverage across every period of that family.

## Insurance plans by period

- [ ] On a grouped invoice, each group has its own Insurance plan action in its header, in place of the one in the invoice header.
- [ ] The insurance plans window opened from a group names that group's encounter type and shows the plans already set on it.
- [ ] An item's insurance coverage comes from the plans set on its group.
- [ ] When an encounter first changes encounter type, the plans already set on the invoice stay with the first group.
- [ ] A group for a new period starts with no insurance plans.

## Printed invoice

- [ ] The printed invoice groups items the same way as the invoice on screen, each group headed by its encounter type and date range.
- [ ] The printed invoice for an encounter that has only ever had one encounter type shows its items without group headings.
