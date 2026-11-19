---
id: TPAGE
---

# Table pagination

Applies to the footer every paginated table in the web app shares: what it tells the user about the records they are looking at, the choice of how many rows a page holds, and moving between pages, along with the column sort the patient lists and worklists remember.

## Footer visibility

- The pagination footer appears whenever a paginated table holds at least one record
- A table with no records shows its empty-state message and no pagination footer

## Record count

- The footer states the range of records on the current page and the total, as a sentence: "Showing 1–10 of 547 records"
- The range runs from the first to the last record on the current page, so the last page shows only the records it holds (e.g. "Showing 541–547 of 547 records")
- When every record fits on one page, the count still shows the range (e.g. "Showing 1–3 of 3 records")
- When the current page holds a single record, the range collapses to that one number (e.g. "Showing 11 of 11 records")
- When the table holds exactly one record, the count reads "Showing 1 of 1 record"
- The count uses the same wording on every table, whatever kind of record the table lists
- Numbers in the count are formatted for the user's selected language, including thousands separators (e.g. "Showing 1–10 of 1,204 records")
- The count wording is translatable

## Rows per page

- A visible "Rows per page" label sits to the left of the rows-per-page dropdown, and the label is translatable
- Each table offers one of two sets of page sizes: the standard set of 10, 25 and 50 rows, or the large set of 50 and 100 rows
- A table with the standard set opens at its default size each time it is shown
- Changing the rows per page returns the table to its first page, and the record count reflects the new page size
- Every page except the last holds as many records as the chosen size, and the last page holds the records remaining

## Page navigation

- Page buttons show the first page, the last page, and the pages either side of the current one, with an ellipsis standing in for each gap. On the first page they show the first three pages, and on the last page the last three
- The current page is highlighted
- Previous and next buttons move one page at a time, and are disabled on the first and last page respectively

## Large page sizes

- The patient lists use the large set: Inpatients, Emergency patients, Outpatients, Bed management, and Recently discharged
- The worklists use the large set: Active and Finalised lab requests, Active and Completed imaging requests, Active medication requests, Dispensed medications, the Immunisation register, and a program registry's patient listing
- The admin panel tools use the large set: Reference data (Manage tab), User profiles, Roles, Designations, the forms table in Programs, Program registries, Templates, Sync status, and Translation (Edit tab)
- System errors, under Facility admin, uses the large set
- Every other paginated table uses the standard set, including All patients, the tables on a patient's or an encounter's tabs, and the task lists

> [!NOTE]
> The large set goes to the tables staff work through in bulk, which is what distinguishes the patient lists, worklists and admin tools from the rest.

## Remembered page size

- A table with the large set opens at 50 rows per page until the user picks a size on it
- Once a user picks a size on a table, the table opens at that size on their later visits, including after logging out and back in
- A size picked on one device opens on any other device the user logs in to. A size picked while logged in to a facility reaches another facility once both have synced
- Each table remembers its own size, so picking a size on one table leaves every other table's size as it was. Active and Finalised lab requests are separate tables, as are Active and Completed imaging requests, and Active medication requests and Dispensed medications
- A table shown across tabs or selections remembers one size for all of them: Program registries shares a size across its Statuses, Related conditions and Related condition categories tabs, Reference data shares one across every type, the forms table in Programs shares one across programs, and a program registry's patient listing shares one across registries
- A size is remembered for the user who picked it, so one user's choice never changes the size another user sees, including on the same device
- A table opening at a remembered size loads its first page at that size, so it loads once rather than loading at 50 and then reloading
- A picked size applies straight away, even if saving it fails. If it wasn't saved, the table opens at the user's previously saved size, or at 50, on the next visit
- When the user's remembered sizes can't be read, or haven't been read after a few seconds, a table with the large set opens at 50 rather than waiting for them. While the browser reports itself offline, it opens at 50 straight away. If the sizes are read later, the table moves to the remembered size, unless the user has picked a size on it by then

> [!NOTE]
> The remembered size belongs to the user rather than to the device, which is why it follows them to every device and facility they log in to.

## Remembered sort

- The tables that remember their search filters also remember the column sort the user applies: Inpatients, Emergency patients, Outpatients, Bed management, Recently discharged, Active and Finalised lab requests, Active and Completed imaging requests, Active medication requests, and Dispensed medications
- Every other table opens at its default sort each time it is shown, and keeps a sort the user applies only until it is shown again
- Once a user applies a sort on one of these tables, the table opens with that sort on their later visits, including after logging out and back in and on any other device they log in to
- A sort is remembered for the user and the facility they are logged in to, the same as the search filters, so a sort applied at one facility leaves the sort at every other facility as it was
- Each table remembers its own sort, so sorting one table leaves every other table's sort as it was. Active and Finalised lab requests are separate tables, as are Active and Completed imaging requests, and Active medication requests and Dispensed medications
- A table opening with a remembered sort loads its first page in that sort, so it loads once rather than loading in the default sort and then reloading
- An applied sort takes effect straight away, and the table keeps it when the user leaves and comes straight back, even before saving it has finished. If it wasn't saved, the table opens with the user's previously saved sort, or its default sort, after they next log in
- Refreshing the table returns it to its default sort, and that is remembered as the user's sort
- When a remembered sort is on a column the table can no longer sort by, the table opens at its default sort
- When the user's remembered sorts can't be read, or haven't been read after a few seconds, the table opens at its default sort rather than waiting for them. If they are read later, the table moves to the remembered sort, unless the user has applied a sort on it by then
