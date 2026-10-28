---
id: PLIST
---

# Patient listing

The patient listing is where facility staff find a patient record from across all patients. It shows recently viewed patients above a patient search, and lists patients only in response to a search.

## Before a search

- [ ] The listing opens with no patients loaded, and a guided empty state in place of the results table
- [ ] The empty state shows the title "Search for a patient" and a hint naming the main search fields (NHN, name and date of birth) and pointing to the advanced search toggle for more options
- [ ] The hint shows the advanced search toggle's own icon inline, so users can match it to the button
- [ ] Download and pagination are hidden while the empty state is showing

## Running a search

- [ ] Selecting Search with at least one search field filled in lists the matching patients in the results table. This includes the advanced search fields and any additional search fields configured for the deployment
- [ ] "Include deceased patients" widens a search to include deceased patients but does not count as search criteria on its own
- [ ] Selecting Search with every field blank, or with only "Include deceased patients" ticked, keeps the empty state showing
- [ ] A search that matches no patients shows "No patients found"
- [ ] Clear empties the search fields and returns the listing to the empty state

## Returning to the listing

- [ ] The listing opens with the search fields cleared and the empty state showing every time it is visited, including when returning from a patient record
