# Inpatient Bed Fee — Implementation Plan (TAM-6900)

Charge a per-night bed fee: night 1 on admission, each later night at the facility-local overnight check time if still admitted, priced per Location, batched into one invoice line per location (`quantity` = nights). Needs the shared foundation — see `fee-engine-build-order.md`.

## Technical approach

- Each bed (Location) is a priceable `InvoiceProduct` (category `BED_FEE`, source = Location); the rate comes from the price list.
- A recompute method (mirrors `Prescription.recalculateAndApplyInvoiceQuantity`, `Prescription.ts:214`) counts qualifying nights to-date per location and upserts **one line per Location** (source record = Location, `quantity` = nights). Recompute **sets**, never increments → safe to run repeatedly.
- Night count = admission night (minimum 1, covering same-day admit / death / abscond / LAMA) + one per facility-local overnight-check boundary crossed while still admitted.
- The location for a night = the location occupied at that check time, reconstructed from `EncounterHistory` (snapshots with `changeType: ['Location']`; take the latest with `date <= checkTime` — `EncounterHistory.ts`).
- "Open ward" placeholder locations are never charged.

## Build steps

### Foundation (bed-fee parts)

- [x] Add `BED_FEE` category + maps (`constants/src/invoices.ts`)
- [x] `InvoiceProduct`: `belongsTo(Location)` + `getSourceRecord()` case; map `BED_FEE → Location`
- [x] Add `Location` to the `InvoiceItemSourceRecord` union (`Invoice.ts`)
- [x] Facility setting: `invoicing.bedFee.overnightChargeTime` (default `02:00`), facility-local (`settings/src/schema/facility.ts`)

### Bed fee

- [x] Pure `computeBedFeeChargeInstants` helper — facility-local night counting (`utils/src/invoice/bedFee.ts`, unit-tested)
- [x] `Invoice.recalculateBedFee(encounter, settings, primaryTimeZone)`: nights-per-location via `EncounterHistory`, reconciles one line per Location (set quantity, remove no-longer-qualifying, soft-delete-aware)
- [x] Night 1 on admission: triggered in the encounter create route when the admission invoice is created
- [x] Placeholder / "open ward" locations excluded — a location is charged only if it has a `BED_FEE` product, so unconfigured placeholders are naturally skipped (the concrete signal)
- [x] `BedFeeCharger` scheduled task (`central-server/app/tasks/`): hourly; recomputes all currently-admitted encounters. Registered in `tasks/index.js`; config under `schedules` in `default.json5`. Batch + sleep

### Tests

- [x] Night counting (same-day = 1, single night, N-night = N, pre-check not counted, facility-local TZ) — unit-tested in `bedFee.test.ts`
- [ ] Location change picks the check-time location — integration
- [ ] Placeholder (no product) not charged — integration
- [ ] Batching by location on the invoice (e.g. ICU ×2, Ward 1 Bed 1 ×3) — integration

## Implementation status — 2026-06-25

Branch `feature/tam-6900-…`, stacked on `feature/tam-6901` (→ 6898 → epic). Two commits. **No DB migration** — BED_FEE is a category string and Location-as-product reuses `InvoiceProduct.sourceRecordId`.

**Done & verified** — `@tamanu/database` + `@tamanu/central-server` build pass, lint clean, `computeBedFeeChargeInstants` unit-tested (5/5):
- Foundation (BED_FEE category, Location product wiring, union, overnight-check-time setting).
- Pure night-counting helper + `Invoice.recalculateBedFee` (per-location reconcile).
- Nightly `BedFeeCharger` + admission night-1 trigger.

**Open / to confirm:**
- **PRD example discrepancy:** the worked example ("admitted June 16, night 2 at 2am June 18") appears off by a day. Implemented interpretation: **one night per facility-local overnight check in (admission, end], min one** → an N-night stay bills N nights. Confirm with the team; if wrong, the rule lives solely in `computeBedFeeChargeInstants`.
- **Discharge-day finalisation:** the nightly job only recomputes still-admitted patients, and the admission trigger + hourly run capture each night at its overnight check. A narrow gap remains for facilities whose check time isn't on the hour if the patient is discharged in the &lt;1h window after the check but before the next hourly run — a recompute on discharge (encounter PUT route) would close it. Not yet wired (the PUT route doesn't currently thread settings/facilityId).
- **65+ stop** is not implemented (no longer a requirement per the Tech Design).
- Integration tests (location attribution, placeholder, batching) not yet run against a live DB.
