---
id: INVGRP
---

# Invoice encounter type sections

An encounter can move between encounter categories part way through, for example a patient who arrives through triage and is then admitted to hospital. With invoice splitting turned on, the encounter's invoice divides its items into sections by the category the patient was in, so staff and patients can see which part of the stay each charge belongs to.

## Setting

Splitting an invoice into sections is a display rule read from the setting as it currently stands, and a facility sets it once when the deployment is configured.

- Sections are controlled by the global Split invoice by encounter type setting, which sits with the other invoicing settings and is off by default.
- With the setting off, every invoice shows its items without section headers.
- Every invoice follows the setting as it currently stands, finalised invoices included.

## Sections

- The sections available are configured as reference data, so a deployment sets which sections exist and the names their headers show. Inpatient, Outpatient and Emergency are configured by default.
- Sections follow the encounter categories set out in [encounter fees](encounter-fees.md). Triage, Active ED care and Emergency short stay all fall in the Emergency section, and imaging in the Outpatient section.
- An item is recorded against its section when it is added, and keeps that section for the life of the item.
- A section's period runs from when the encounter entered that category until it moved to another category, or until the encounter ended. A period that is still running ends today.
- A section's period is unknown where the facility does not hold the record of the encounter moving into that category.
- Every boundary between sections is an admission, so it falls at the admission date and time entered on the move rather than at the time the move was recorded.
- The day a patient moves falls within both the ending section's period and the starting section's, because an item carries a date and not a time.
- Vaccination and form response encounters are never divided into sections.
- An item added automatically is recorded against the section for the category the encounter is in when the item is added, so the emergency fee sits in the Emergency section and bed fees in the Inpatient section, as [encounter fees](encounter-fees.md) sets out.
- An item added manually is recorded against the section it was added from.
- Changing an item's date never moves it to another section. An item is moved between sections by deleting it and adding it again from the other section.
- An item whose date falls outside its section's period, because the admission time was corrected after the item was added, stays in its section and is listed at the date it holds.

## Sectioned invoice

- An invoice for an encounter that has only ever been in one category shows its items without section headers.
- An invoice for an encounter that has moved between categories shows one section per period, in date order, including periods with no items.
- An item that carries no section is listed in an unlabelled section at the foot of the invoice, below every other section.
- Each section opens with a header row showing the section's name and, where its period is known, the period's date range.
- The date range of a period that is still running reads as its start date followed by "Current".
- A section whose period is unknown shows its name alone, and is listed after the sections with periods and above the unlabelled section.
- Each section header is marked with the colour its category's encounter types carry in the encounter view, Outpatient carrying the clinic colour. A section that is not an encounter category carries a default colour.
- Invoice-wide actions sit in a single overflow menu for the invoice; a section header carries no actions of its own.
- Each section ends with its own Add item action. A section whose period holds no items shows its header and that action alone.
- Invoice totals cover every section.
- The invoice summary covers the whole invoice, sections included.

> [!NOTE]
> An item has no section when the one it was recorded against is unavailable to the facility. Listing those items last keeps them on the invoice and in the totals rather than hiding them.

> [!NOTE]
> A section an item names is shown even when its period is unknown, because the item already carries which part of the stay it belongs to. Withholding the section until its dates are known would lose that, and the dates are the lesser half of what the header says.

## Adding and editing items

- A section's Add item opens the Add items window for that section, naming its category and date range.
- The Edit invoice window divides items into sections the same way as the invoice, each section opening with its header row.
- A section's date picker only offers dates within that section's period, so an item cannot be given a date belonging to another section.
- In a section whose period is unknown, the date picker offers the dates of the encounter itself.
- In a section whose period has ended, a new item's date starts empty.
- In the section for the current period, a new item's date starts at today and can be backdated as far as the section's start, which on an encounter that has never moved is the encounter's start.
- Editing an item's date in the Edit invoice window follows the same limits as the section it belongs to. An item already dated outside its period is left at the date it holds, so the window saves without disturbing it.
- A date typed outside the allowed range shows an inline error giving the first and last allowed dates, and the items cannot be saved until it is corrected.
