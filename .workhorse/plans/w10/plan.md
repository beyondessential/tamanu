# Empty patient listing until a search is run

## Design direction

The all patients table loads nothing until the user runs a search. The unfiltered list only ever showed the same few patients from the top of the default ordering, so it gave users nothing useful.

- In place of the table, a guided empty state: a primary-tinted round badge with a person-search icon, "Search for a patient", and a hint that more than the visible fields can be searched ("Search by NHN, name, date of birth and more")
- A "Show advanced search" link in the empty state opens the same advanced fields as the double-chevron toggle, which is otherwise easy to miss
- There is no way to load every patient without searching
- Download and pagination are hidden while there are no results, matching the table's existing behaviour when it has no rows

Mockup: `.workhorse/design/mockups/w10/option-c-guided.html`
