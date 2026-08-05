# TAM-6895 — Discharge medications: dispensing qty and pharmacy ordering

Implements `specs/medication/discharge-medications.md` (`DISCHMED`).

## Approach

The discharge PUT (`encounter.js`) already loops the submitted medications inside the discharge
transaction — updating quantity/repeats, setting `isSelectedForDischarge`, promoting ongoing
medications. The pharmacy order is created in that same transaction, so a failed order cannot
leave a discharged patient with no order (and vice versa). No second request from the client.

`Last sent` needs the newest order line's dispensed state, not just its date. Both
`lastOrderedAt` queries aggregate with `MAX(po.date)`, which discards the row — they become
`DISTINCT ON` so the matching line's `is_completed` comes back alongside the date.

## Backend

- [x] `utils/medication.js` — `getLastOrderedAtForOngoingPrescriptions` returns the newest line's
      `is_completed` alongside `last_ordered_at` (`DISTINCT ON`, not `MAX`). Existing callers read
      `last_ordered_at`, so keep that key
- [x] `encounter.js` `GET /:id/medications` — same change to its inline last-ordered query; expose
      the dispensed state on each prescription
- [x] `encounter.js` `GET /:id/medications` — include `referenceDrug.facilities` (scoped to
      `facilityId`) so Stock has a status to read, matching the ongoing-prescriptions endpoint
- [x] `patient.js` `GET /:id/ongoing-prescriptions` — expose the dispensed state
- [x] `encounter.js` `PUT /:id` — accept a pharmacy order on the discharge body and create the
      `PharmacyOrder` + `PharmacyOrderPrescription` rows in the discharge transaction, as an
      Outpatient/Discharge prescription. Set `ongoingPrescriptionId` on lines that came from the
      patient's ongoing medications so both Last sent surfaces resolve them

## Frontend — `DischargeForm.jsx`

- [x] Rename the column to "Dispensing qty", mark it required
- [x] Validate dispensing quantity as required, minimum 1, for every row in both tables
- [x] Gate the pharmacy columns on `features.pharmacyOrder.enabled`
- [x] "Send to pharmacy" column — encounter medications ticked, ongoing medications not
- [x] "Last sent" column — date plus active-request/dispensed state, n/a when never sent
- [x] "Stock" column — reuse `getStockStatus`, shown only when some row has a status
- [x] Ordering prescriber in the encounter-medication header, defaulting to the current user,
      required, inactive while nothing is selected
- [x] Pass `facilityId` to the ongoing-prescriptions query so stock resolves
- [x] Confirmation step when a selected medication was sent within the already-ordered window
- [x] Drop the "send to pharmacy from the encounter" note
- [x] Persist selections and ordering prescriber in the discharge draft

## Tests

- [x] Endpoint tests for the discharge pharmacy order and the last-sent state
- [x] Test cases file at `.workhorse/test-cases/TAM-6895/overview.md`
