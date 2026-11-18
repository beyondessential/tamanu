# Wildcards in search text match literally

Typing `_` or `%` into a search field matches only records containing that character, never every record.

## Automated

- [x] `likePattern` keeps the template's own wildcards and escapes `%`, `_` and `\` in interpolated values
- [x] All patients list: `_` in last name and `%` in first name or display ID match literally
- [x] Patient lookup field (suggester): `_` returns only patients with `_` in their name or display ID, `%` returns nothing
- [x] Imaging requests list: `_` in last name and `%` in first name or display ID return no requests
- [x] Pharmacy (medication requests) list: `_` in last name and `%` in first name or display ID return no requests
- [x] Notes search treats `%` literally
- [x] Lint flags an untagged template splicing a value next to `%`, and `Op.substring`, `Op.startsWith` and `Op.endsWith`

## Manual

- [ ] Desktop triage list, upcoming vaccinations and recently discharged lists: search `_` in first name, last name and display ID, and see only matching patients
- [ ] Desktop lookup fields (diagnosis, location, clinician): typing `_` or `%` shows only options containing that character
- [ ] Desktop encounter lookup: searching a date such as `01/02` still finds encounters on that date
- [ ] Admin: users, roles, designations and reference data Manage tab searches treat `_` and `%` literally
- [ ] Admin: creating a user whose display name differs from an existing one only by a `_` is not rejected as a duplicate
- [ ] Mobile patient search: `_` in the search bar, and in the first or last name filters, shows only matching patients
- [ ] Mobile lookup fields: typing `_` shows only options containing `_`, with prefix matches first
- [ ] HL7 FHIR Patient search with `given:contains=_` returns only patients with `_` in their given name
