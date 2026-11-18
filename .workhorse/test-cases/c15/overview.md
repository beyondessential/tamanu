# Wildcards in search text match literally

Typing `_` or `%` into a search field matches only records containing that character, never every record.

## Automated

- [x] `likePattern` keeps the template's own wildcards and escapes `%`, `_` and `\` in interpolated values
- [x] With `LIKE_ESCAPE_CLAUSE`, SQLite matches `likePattern` values literally
- [x] All patients list: `_` in last name and `%` in first name or display ID match literally
- [x] Patient lookup field (suggester): `_` returns only patients with `_` in their name or display ID, `%` returns nothing
- [x] Imaging requests list: `_` in last name and `%` in first name or display ID return no requests
- [x] Pharmacy (medication requests) list: `_` in last name and `%` in first name or display ID return no requests
- [x] Medication dispenses list: `_` in last name and `%` in first name or display ID return no dispenses
- [x] Notes search treats `%` literally
- [x] Patient documents: type and document owner filters treat `_` and `%` literally
- [x] Encounter lookup: full and `dd/mm` date queries find encounters on that date, and `_` and `%` match literally
- [x] Reference data import: a foreign key given by name matches `_` and `%` literally
- [x] Appointments: `_` and `%` in the patient name or ID search match literally
- [x] Upcoming vaccinations: display ID, first name and last name filters match, and `_` and `%` match literally
- [x] Lab requests list: the published date filter returns only requests published that day
- [x] Admin designations and roles: an id search with `_` returns only ids containing `_`
- [x] Admin reference data Manage: text and linked-record name searches treat `_` literally
- [x] Admin users list: display name, display ID and email searches treat `_` and `%` literally
- [x] Admin users: create, validate and update reject a display name matching another in different case, and accept one differing only by `_` or `%`
- [x] Lint flags an untagged template splicing a value next to `%`, and `Op.substring`, `Op.startsWith` and `Op.endsWith`

## Manual

- [ ] Desktop triage list and recently discharged list: search `_` in first name, last name and display ID, and see only matching patients
- [ ] Desktop lookup fields (diagnosis, location, clinician): typing `_` or `%` shows only options containing that character
- [ ] Mobile patient search: `_` in the search bar, and in the first or last name filters, shows only matching patients
- [ ] Mobile lookup fields: typing `_` shows only options containing `_`, with prefix matches first
