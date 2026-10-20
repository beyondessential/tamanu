# Diet summary sheet by ward

This card covers the design only. Building the sheet in Tamanu is a separate piece of work. The mockup is `.workhorse/design/mockups/f11/diet-summary-by-ward.html`.

## Design decisions

- Landscape A4, keeping the existing letterhead, title and footer
- Page 1 holds a summary table: a **Hospital total** row first, then one row per ward with that ward's diet counts (ward sub-totals)
- Per-ward detail follows, running on from page to page. A ward that breaks across a page continues under "{Ward} (continued)" with the column headers repeated
- Each ward section is a patient × diet grid: patient name, NHN and bed, then a tick under each of the patient's diets. A **Sub total** row at the top of each ward table carries that ward's counts, matching the summary's total-first layout
- Columns show every diet in reference data, plus **Regular** first
- An admitted patient with no diet recorded is counted under Regular
- A patient with several diets is ticked, and counted, under each one
- Ward is the encounter's area, and bed is its location
- Patients are ordered by bed within a ward (provisional, not yet confirmed)

## Open questions

- Patient order within a ward: by bed or by name?
- Wards with no admitted patients: shown in the summary as empty rows, left out of the detail?
- Ward sub-total row: top of the ward table (as mocked) or bottom?
