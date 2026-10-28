# Empty patient listing until a search is run

## Design direction

The all patients table loads nothing until the user runs a search. The unfiltered list only ever showed the same few patients from the top of the default ordering, so it gave users nothing useful.

- In place of the table, a guided empty state: a primary-tinted round badge with a person-search icon, "Search for a patient", and a hint that points to the advanced search toggle: "Search by NHN, name or date of birth. Otherwise select [double chevron] for more advanced search options." The hint shows the toggle's own double-chevron icon inline, in primary blue, so users can match it to the button
- There is no way to load every patient without searching
- Download and pagination are hidden while there are no results, matching the table's existing behaviour when it has no rows

Mockup: `.workhorse/design/mockups/w10/Mockup.html`

## What counts as a search

- A search needs at least one criterion. Selecting Search with every field blank keeps the empty state, so a blank search can't be used to get around it
- "Include deceased patients" is a modifier, not a criterion: ticking it alone keeps the empty state
- Clear returns to the empty state
- The listing doesn't remember the last search. It opens empty every time, including when coming back from a patient. The admitted and outpatient listings do remember their search, but this listing keeps its existing local-state behaviour
- Only the all patients listing changes. The admitted and outpatient listings already show a specific set of patients and keep loading straight away

## Implementation notes

- `PatientListingView` (`packages/web/app/views/patients/PatientListingView.jsx`) holds search parameters in local state. It needs to know whether a search has run with real criteria (any non-empty value other than `deceased`) and render the empty state in place of `PatientTable` until then
- `CustomisableSearchBar`'s Clear calls `onSearch({})`, which naturally returns to the empty state under that rule
