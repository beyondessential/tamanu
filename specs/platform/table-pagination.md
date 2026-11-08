---
id: TPAGE
---

# Table pagination

Paginated tables in the web app share a footer that tells the user which records they are looking at, lets them choose how many rows a page holds, and moves between pages. Every paginated table uses the same footer, so the behaviour below holds wherever a table is paged.

Most tables offer small page sizes and open at the same size on every visit. The tables staff work through in bulk (patient lists, worklists and admin tools) offer large page sizes instead, and remember the size each user last picked on them.

## Rows per page

- [ ] Each table offers one of two sets of page sizes: the standard set of 10, 25 and 50 rows, or the large set of 50 and 100 rows
- [ ] A table with the standard set opens at its default size each time it is shown
- [ ] Changing the rows per page returns the table to its first page, and the record count reflects the new page size
- [ ] Every page except the last holds as many records as the chosen size, and the last page holds the records remaining

## Large page sizes

- [ ] The patient lists use the large set: Inpatients, Emergency patients, Outpatients, Bed management, and Recently discharged
- [ ] The worklists use the large set: Active and Finalised lab requests, Active and Completed imaging requests, Active medication requests, Dispensed medications, the Immunisation register, and a program registry's patient listing
- [ ] The admin panel tools use the large set: Reference data (Manage tab), User profiles, Roles, Designations, the forms table in Programs, Program registries, Templates, Sync status, and Translation (Edit tab)
- [ ] System errors, under Facility admin, uses the large set
- [ ] Every other paginated table uses the standard set, including All patients, the tables on a patient's or an encounter's tabs, and the task lists

## Remembered page size

A table with the large set remembers the size each user picks on it. The choice belongs to the user rather than to the device, so it follows them to every device and facility they log in to.

- [ ] A table with the large set opens at 50 rows per page until the user picks a size on it
- [ ] Once a user picks a size on a table, the table opens at that size on their later visits, including after logging out and back in
- [ ] A size picked on one device opens on any other device the user logs in to. A size picked while logged in to a facility reaches another facility once both have synced
- [ ] Each table remembers its own size, so picking a size on one table leaves every other table's size as it was. Active and Finalised lab requests are separate tables, as are Active and Completed imaging requests, and Active medication requests and Dispensed medications
- [ ] A table shown across tabs or selections remembers one size for all of them: Program registries shares a size across its Statuses, Related conditions and Related condition categories tabs, Reference data shares one across every type, the forms table in Programs shares one across programs, and a program registry's patient listing shares one across registries
- [ ] A size is remembered for the user who picked it, so one user's choice never changes the size another user sees, including on the same device
- [ ] A table opening at a remembered size loads its first page at that size, so it loads once rather than loading at 50 and then reloading
- [ ] A picked size applies straight away, even if saving it fails. If it wasn't saved, the table opens at the user's previously saved size, or at 50, on the next visit
- [ ] When the user's remembered sizes can't be read, or haven't been read after a few seconds, a table with the large set opens at 50 rather than waiting for them. While the browser reports itself offline, it opens at 50 straight away. If the sizes are read later, the table moves to the remembered size, unless the user has picked a size on it by then
