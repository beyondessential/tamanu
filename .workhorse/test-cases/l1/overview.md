# Invoice encounter type sections: test cases

Money is on screen here, so the totals cases matter as much as the sectioning ones: an item that
lands in the wrong section is a display fault, but an item that falls out of a total is a billing
fault. Every case assumes invoicing is on.

## The setting

- [ ] Split invoice by encounter type is off by default on a fresh deployment (verifies spec: INVGRP)
- [x] With the setting off, an encounter that moved from triage to admission shows its items in one list with no section headers (verifies spec: INVGRP)
- [ ] Turning the setting on sections an invoice that already has items, with no edit to the invoice (verifies spec: INVGRP)
- [ ] Turning it back off returns that invoice to a flat list, items and totals unchanged (verifies spec: INVGRP)
- [ ] A finalised invoice sections and unsections with the setting the same way an open one does (verifies spec: INVGRP)

## Sections as reference data

- [x] Provisioning a new deployment creates the Inpatient, Outpatient and Emergency sections
- [ ] The Invoice section type imports from the reference data spreadsheet and is editable in the admin panel's Manage tab
- [ ] Renaming a section in reference data changes the name its header shows, with no change to which items sit under it (verifies spec: INVGRP)
- [x] A deployment with no Invoice section rows renders every invoice flat rather than erroring (verifies spec: INVGRP)
- [ ] An item whose section row is unavailable to the facility is listed in an unlabelled section at the foot, below every other section (verifies spec: INVGRP)
- [x] A section hidden in reference data is not offered as a header and is not resolved for new items

## Which section an item lands in

- [x] A triage encounter's items land in Emergency; so do an Active ED care and an Emergency short stay encounter's (verifies spec: INVGRP)
- [ ] A clinic encounter's items land in Outpatient, and so do an imaging encounter's (verifies spec: INVGRP)
- [ ] An admission encounter's items land in Inpatient (verifies spec: INVGRP)
- [x] A vaccination encounter and a form response encounter show no section headers at all (verifies spec: INVGRP)
- [x] An item added from a section's Add item is recorded against that section (verifies spec: INVGRP)
- [x] The emergency fee added at triage stays in Emergency after the patient is admitted (verifies spec: INVGRP)
- [x] Bed fees accrued after admission sit in Inpatient (verifies spec: INVGRP)
- [ ] Editing an item's date never moves it to another section (verifies spec: INVGRP)
- [x] Saving the invoice again with a different section id in the payload leaves the item's section as it was (verifies spec: INVGRP)
- [ ] An item's section survives a round trip through the Edit invoice window untouched (verifies spec: INVGRP)
- [ ] There is no control anywhere in the web app for changing an item's section (verifies spec: INVGRP)
- [x] An item added before the encounter has moved, while the invoice still shows no headers, lands in the category it was charged in rather than unlabelled (verifies spec: INVGRP)
- [x] An auto-added line whose source record is edited after the patient is admitted stays in the section it was charged in (verifies spec: INVGRP)
- [x] A section id that is not an invoice section is refused rather than stored

## Periods

- [x] An encounter that has only ever been in one category shows its items with no section headers (verifies spec: INVGRP)
- [x] An encounter moved from triage to admission shows two sections, in date order (verifies spec: INVGRP)
- [x] The boundary falls at the Admission date & time entered on the move, not at the time the move was recorded (verifies spec: INVGRP)
- [ ] An item dated the day of the move can be added from either adjacent section (verifies spec: INVGRP)
- [x] Correcting the admission time after items exist leaves every item in its section, listed at the date it holds (verifies spec: INVGRP)
- [ ] The running period's header reads its start date followed by Current (verifies spec: INVGRP)
- [ ] A period with no items shows its header and its Add item action alone (verifies spec: INVGRP)
- [x] An encounter type set wrongly and corrected back reads as one section for that category, with its items listed once (verifies spec: INVGRP)

## A section with no period

- [x] An encounter whose move is not in the facility's record shows the section its items carry, under its name with no date range (verifies spec: INVGRP)
- [x] That section is listed after the sections that have periods and above the unlabelled one (verifies spec: INVGRP)
- [ ] Its Add item offers the dates of the encounter itself (verifies spec: INVGRP)
- [ ] Its items are counted in the invoice totals exactly as a dated section's are (verifies spec: INVGRP)
- [ ] A facility that receives the encounter and its move together shows both sections with their date ranges

## Totals and the rest of the invoice

- [ ] The invoice total is the sum of every section's items, including the unlabelled one (verifies spec: INVGRP)
- [ ] The summary panel's rows cover the whole invoice, not the first section (verifies spec: INVGRP)
- [ ] Discounts and item adjustments reach the total from every section (verifies spec: INVGRP)
- [ ] Insurance stays invoice-wide: one Insurance plan action and one coverage line, whatever the sections
- [ ] Invoice-wide actions sit in one overflow menu for the invoice, and no section header carries an action of its own (verifies spec: INVGRP)
- [ ] Each section header is marked with the colour its category carries in the encounter view, Outpatient taking the clinic colour (verifies spec: INVGRP)
- [ ] A configured section that is not an encounter category carries the default colour rather than none (verifies spec: INVGRP)

## Adding and editing items

- [ ] A section's Add item opens the Add items window naming that section and its date range (verifies spec: INVGRP)
- [x] The date picker offers only dates inside that section's period (verifies spec: INVGRP)
- [ ] In a section whose period has ended, a new item's date starts empty (verifies spec: INVGRP)
- [x] In the running section, a new item's date starts at today and backdates as far as that section's start, and no further (verifies spec: INVGRP)
- [x] On an encounter that never moved, the running section backdates as far as the encounter's start (verifies spec: INVGRP)
- [x] A date after today is not offered
- [ ] The Edit invoice window divides items into the same sections, each opening with its header row (verifies spec: INVGRP)
- [x] An item already dated outside its section's period is left at that date, and an unrelated edit elsewhere on the invoice still saves (verifies spec: INVGRP)
- [x] Editing that item's date itself is held to the section's limits (verifies spec: INVGRP)
- [x] A date typed outside the range shows an inline error naming the first and last allowed dates (verifies spec: INVGRP)
- [x] The items cannot be saved while that error stands (verifies spec: INVGRP)
- [x] In a section whose period is unknown, the picker offers the encounter's own dates rather than any date at all (verifies spec: INVGRP)
- [x] An item on an unsectioned invoice is held to the encounter's own date range
- [x] A new row never opens on a date its own section would reject
- [x] An admission corrected to before the category it follows still leaves a selectable date range
- [x] A facility in a different timezone from the server sees the boundary on its own calendar date
- [x] Every item of one lab request lands in the section the encounter was in
- [x] An empty section id is refused rather than reaching the database
- [x] A provisioned section id, which is a code rather than a uuid, is accepted
- [x] An item's date is bounded by the encounter even with the splitting setting off
- [x] A vaccination encounter returns an empty section list rather than none at all
- [x] Every item of one imaging request lands in the section the encounter was in
- [x] An item id belonging to another invoice is refused rather than moved
- [x] Reading an invoice and writing its items are both refused without permission
- [x] An item whose section row was hidden after it was recorded keeps that section and is listed at the foot (verifies spec: INVGRP)
- [x] An invoice with one section and some unlabelled items shows headers, with the unlabelled ones at the foot (verifies spec: INVGRP)

## Layout and operation

- [ ] The sectioned invoice fits the invoice pane at 1440px without scrolling sideways
- [ ] An item's price breakdown does not widen the Cost column once section headers are present
- [ ] An invoice with many sections and many items scrolls without the headers losing their items
- [ ] An upgraded deployment's existing invoice items carry no section and are listed at the foot (verifies spec: INVGRP)
- [ ] Reading an invoice does not read the changelog more than once per encounter
