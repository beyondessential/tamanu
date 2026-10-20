# Empty patient listing until a search is run

## Design direction

The all patients table loads nothing until the user runs a search. The unfiltered list only ever showed the same few patients from the top of the default ordering, so it gave users nothing useful.

- In place of the table, a guided empty state: a primary-tinted round badge with a person-search icon, "Search for a patient", and a hint that points to the advanced search toggle: "Search by NHN, name or date of birth. Otherwise select [double chevron] for more advanced search options." The hint shows the toggle's own double-chevron icon inline, in primary blue, so users can match it to the button
- There is no way to load every patient without searching
- Download and pagination are hidden while there are no results, matching the table's existing behaviour when it has no rows

Mockup: `.workhorse/design/mockups/w10/Mockup.html`
