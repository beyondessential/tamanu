---
id: PLIST
---

# Patient listing

The patient listing is where facility staff find a patient record from across all patients. It shows recently viewed patients above a patient search, and lists patients only in response to a search.

## Before a search

- [ ] The listing opens with no patients loaded, and a guided empty state in place of the results table
- [ ] The empty state shows the title "Search for a patient" and a hint naming the main search fields (the patient identifier, name and date of birth) and pointing to the advanced search toggle for more options
- [ ] The hint names the patient identifier using the deployment's own label for it (NHN by default)
- [ ] The hint shows the advanced search toggle's icon inline
- [ ] Download and pagination are hidden while the empty state is showing
- [ ] Users without permission to list patients see the no-permission message in place of the empty state

## Running a search

- [ ] Selecting Search with at least one search field filled in lists the matching patients in the results table. This includes the advanced search fields and any additional search fields configured for the deployment
- [ ] "Include deceased patients" widens a search to include deceased patients but does not count as search criteria on its own
- [ ] A field containing only spaces counts as blank
- [ ] Selecting Search with every field blank, or with only "Include deceased patients" ticked, shows the empty state, including when results from an earlier search are showing
- [ ] A search that matches no patients shows "No patients found"
- [ ] Clear empties the search fields and returns the listing to the empty state

## Returning to the listing

- [ ] The listing opens with the search fields cleared and the empty state showing every time it is visited, including when returning from a patient record
