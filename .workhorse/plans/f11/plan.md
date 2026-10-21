# Diet summary sheet by ward

The diet summary sheet is a new printout in Tamanu. It doesn't exist in the product yet: the attached `Diet_summary.pdf` is a design concept, not a screen we're changing. This card covers designing the sheet and building it. The mockup is `.workhorse/design/mockups/f11/diet-summary-by-ward.html`.

## Purpose

Kitchen and ward staff use the sheet to see how many meals of each diet to prepare per ward, and which patient each meal is for.

## Requirements

### Printing the sheet

- Printed from Bed management, through a **Diet summary** button beside Handover notes in the search bar
- Covers the facility the user is logged in to. With no area selected in the search bar it covers every ward; with an area selected it covers that ward only
- Anyone who can list patients and read areas can print it, the same permissions handover notes use (`list Patient`, `read LocationGroup`). There's no new permission
- It's a snapshot of the facility at the moment of printing, and the print date and time appear in the footer
- Opens in the standard PDF preview modal with a print action, like the handover notes printout (`HandoverNotesModal`)
- Uses the facility's certificate letterhead (logo, title, subtitle) from the existing certificate settings
- All headings and labels are translatable (PDF `getTranslation`), and diet and area names use reference data translations

### Who appears on it

- Every patient with an open admission at the facility (admission encounters only, `encounters.end_date IS NULL`). Emergency, triage and clinic encounters are left off, even when they have a bed
- The ward is the encounter's area (location group), and the bed is its location
- Patients are identified by name and NHN (display ID)

### Layout

- Landscape A4, with letterhead, title ("Diet summary sheet | {month} | {date}") and a footer showing print date and time and page numbers
- Page 1 holds a summary table: a **Hospital total** row first, then one row per ward with that ward's diet counts (ward sub-totals)
- Per-ward detail follows, running on from page to page. A ward that breaks across a page continues under "{Ward} (continued)" with the column headers repeated
- Each ward section is a patient × diet grid: patient name, NHN and bed, then a tick under each of the patient's diets. A **Sub total** row at the top of each ward table carries that ward's counts, matching the summary's total-first layout
- Patients are ordered by bed within a ward (provisional, not yet confirmed)

### Counting

- Columns show every diet in reference data, plus **Regular** first
- An admitted patient with no diet recorded is counted under Regular
- A patient with several diets is ticked, and counted, under each one, so a ward's diet counts can add up to more than its number of patients
- The hospital total is the sum of the ward sub-totals

## Technical notes

- Diets are `diet` reference data linked to encounters through `EncounterDiet`
- Closest precedent: handover notes. The PDF lives in `@tamanu/shared`, the data comes from a facility-server route behind a permission check, and the web side is a modal using `PDFLoader` / `printPDF`
- A facility-wide query over open admissions needs an index-backed plan. Check it against realistic volume, not seed data

## Open questions

- With a single ward selected, does the sheet keep the summary page and Hospital total, or go straight to that ward's detail?
- Do the other Bed management filters (bed status, etc.) narrow the sheet, or does only the area filter apply?
- What does "{month}" in the title mean? Probably the print month, but the attached concept is ambiguous
- Patient order within a ward: by bed or by name?
- Wards with no admitted patients: shown in the summary as empty rows, left out of the detail?
- Ward sub-total row: top of the ward table (as mocked) or bottom?
- Patients whose location has no area (every encounter has a location, but an area is optional): left off the sheet, or grouped under "No ward"?
