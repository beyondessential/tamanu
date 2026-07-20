# Reference: `id` vs `display_id`

A recurring source of confusion when investigating in the database. Get this
right before running any lookup.

- **`id`** — the internal UUID. 32 hex characters with 4 hyphens, unique in every
  case (e.g. `d28ca1c0-3919-4fbf-ab23-77f4e7a0363f`). This is what foreign keys
  and FHIR `upstream_id` point at. Joins use `id`.
- **`display_id`** — the short human-facing identifier shown in the Tamanu
  frontend (e.g. a patient NHN `KGRO765069`, or a lab request `G6GRJVZ`). This is
  what a user or a facility will quote to you. Look up **by** `display_id`, then
  use the returned `id` for joins.

## Worked example

For patient "Rajneel Ram":

- Patient NHN (this is the patient's `display_id`): `KGRO765069`
- Patient `id`: `47dee007-5b7c-4c21-83b0-1147d5ea33cf`
- Lab request as shown in the UI (its `display_id`): `G6GRJVZ`
- Lab request `id`: `d28ca1c0-3919-4fbf-ab23-77f4e7a0363f`

These map straight onto the frontend URL:

```
/patients/all/47dee007-...-33cf/encounter/50184d65-...-99fd/lab-request/d28ca1c0-...-363f
             ^patient id                    ^encounter id              ^lab request id
```

So the URL is built from **`id`s**, while the search boxes and printed labels use
**`display_id`s**.

## Practical rule

1. The facility gives you a `display_id` (NHN, lab request code, imaging request
   code).
2. Query the relevant table `WHERE display_id = '<value>'` to get the row and its
   `id`.
3. Use that `id` for every downstream join — e.g.
   `fhir.service_requests.upstream_id = <lab_request.id>`.
