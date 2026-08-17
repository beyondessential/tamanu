---
id: LREQ
---

# Requesting lab tests and panels

Staff raise a lab request from a single screen that captures the request details, the tests and panels being ordered, and any notes. Tests and panels are chosen from one combined, category-grouped list, with guards that stop the same test being ordered both on its own and as part of a panel.

## Request screen

- [ ] The new lab request screen presents the request details, the test and panel selection, and notes together on one screen, followed by a Cancel action and a Next action.
- [ ] The request details are the requesting clinician, the request date and time, the department, and the priority.
- [ ] The requesting clinician and the request date and time are required; the department and priority are optional.

## Test and panel selection

- [ ] Tests and panels are chosen from one combined list grouped by category, with categories ordered alphabetically.
- [ ] Within a category, individual tests and panels appear together in a single alphabetical order by name.
- [ ] An individual test is a selectable row.
- [ ] A panel is a selectable row that shows how many tests it contains and can be expanded to reveal those member tests. Member tests are shown for reference only and cannot be selected on their own from within the panel.
- [ ] Panels are collapsed by default, and each panel is expanded or collapsed on its own.
- [ ] Where a facility only allows panel ordering, the list contains only panels, each still expandable to its read-only member tests.

## Search and category filter

- [ ] A search field matches against test and panel names.
- [ ] While a search term is entered, the list shows a flat list of matching tests and panels rather than the category grouping.
- [ ] A single-select category filter narrows the list to one category.
- [ ] The search term and the category filter apply together.

## Preventing duplicate tests

- [ ] Selecting a panel disables the standalone rows of the individual tests it contains, and a disabled row explains why on hover: "A panel containing this test has already been selected".
- [ ] Selecting a panel removes any standalone selection of a test that panel contains.
- [ ] A test may belong to more than one panel, and selecting one panel that contains it does not prevent selecting another panel that also contains it.
- [ ] Removing a selected panel re-enables the standalone rows of its member tests, unless another selected panel still contains them.

## Selected items

- [ ] A selected-items summary lists the chosen tests and panels grouped by category, with a count in which each panel counts as one item.
- [ ] Each selected item can be removed on its own, and a clear-all action removes every selection at once.

## Proceeding

- [ ] The Next action becomes available only once at least one test or panel is selected.
- [ ] Notes can be added to the request.
