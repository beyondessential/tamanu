---
id: TPAGE
---

# Table pagination

Paginated tables in the web app share a footer that tells the user which records they are looking at, lets them choose how many rows a page holds, and moves between pages. Every paginated table uses the same footer, so the behaviour below holds wherever a table is paged.

## Footer visibility

- [ ] The pagination footer appears whenever a paginated table holds at least one record
- [ ] A table with no records shows its empty-state message and no pagination footer

## Record count

- [ ] The footer states the range of records on the current page and the total, as a sentence: "Showing 1–10 of 547 records"
- [ ] The range runs from the first to the last record on the current page, so the last page shows only the records it holds (e.g. "Showing 541–547 of 547 records")
- [ ] When the current page holds a single record, the range collapses to that one number (e.g. "Showing 11 of 11 records")
- [ ] When the table holds exactly one record, the count reads "Showing 1 of 1 record"
- [ ] The count uses the same wording on every table, whatever kind of record the table lists
- [ ] Numbers in the count are formatted for the user's selected language, including thousands separators (e.g. "Showing 1–10 of 1,204 records")
- [ ] The count wording is translatable

## Rows per page

- [ ] A visible "Rows per page" label sits to the left of the rows-per-page dropdown
- [ ] The dropdown offers 10, 25 and 50 rows per page
- [ ] Changing the rows per page returns the table to its first page, and the record count reflects the new page size
- [ ] The label is translatable

## Page navigation

- [ ] Page buttons show the first page, the last page, and the pages either side of the current one, with an ellipsis standing in for each gap
- [ ] The current page is highlighted
- [ ] Previous and next buttons move one page at a time, and are disabled on the first and last page respectively
