# Inpatient bed fee (TAM-6900)

Charge a per-night bed fee: night 1 on admission, each later night at the facility-local overnight check time if still admitted, priced per location, batched into one invoice line per location (`quantity` = nights).

Implements the inpatient bed-fee section of `spec: FEES`. Needs the shared foundation from TAM-6898 (invoice-item categories + source types, facility-settings block, the invoice auto-create chokepoint, and the timezone conversion helpers).

## Foundation (bed-fee parts)

The bed fee reuses the same attach/idempotency mechanism as the encounter fee, with the **Location** as the source record so lines batch by location. See TAM-6898's plan for the shared attach mechanism.

- **Bed-fee products** point at a **Location** — add a `belongsTo(Location)` association + a `getSourceRecord()` case, mapping `BED_FEE → Location`.
- Extend the `InvoiceItemSourceRecord` union (`Invoice.ts:25`) with **Location**; confirm it exposes `getModelName()` / `id()`.
- Bed fee reads the overnight check time from the facility-scoped settings block (`invoicing.bedFee.overnightChargeTime`, default `02:00`).

## Technical approach

- Each bed (Location) is a priceable `InvoiceProduct` (category `BED_FEE`, source = Location); the rate comes from the price list.
- A recompute method (mirrors `Prescription.recalculateAndApplyInvoiceQuantity`, `Prescription.ts:214`) counts qualifying nights to-date per location and upserts **one line per Location** (source record = Location, `quantity` = nights). Recompute **sets**, never increments → safe to run repeatedly.
- Night count = admission night (minimum 1, covering same-day admit / death / abscond / LAMA) + one per facility-local overnight-check boundary crossed while still admitted.
- The location for a night = the location occupied at that check time, reconstructed from `EncounterHistory` (snapshots with `changeType: ['Location']`; take the latest with `date <= checkTime` — `EncounterHistory.ts`).
- "Open ward" placeholder locations are never charged — a location is charged only if it has a `BED_FEE` product, so unconfigured placeholders are naturally skipped.
- Stored datetimes are in the **primary** timezone; the overnight check is evaluated in **facility-local** time.

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

## Implementation notes

Branch `feature/tam-6900-…`, stacked on `feature/tam-6901` (→ 6898 → epic). Two commits. **No DB migration** — BED_FEE is a category string and Location-as-product reuses `InvoiceProduct.sourceRecordId`.

**Done & verified** — `@tamanu/database` + `@tamanu/central-server` build pass, lint clean, `computeBedFeeChargeInstants` unit-tested (5/5):
- Foundation (BED_FEE category, Location product wiring, union, overnight-check-time setting).
- Pure night-counting helper + `Invoice.recalculateBedFee` (per-location reconcile).
- Nightly `BedFeeCharger` + admission night-1 trigger.

**Resolved decisions:**
- **Night counting — confirmed (matches the PRD).** Re-traced: the implementation reproduces the schedule (night 1 at admission, then one per overnight check). Rule: one night per facility-local overnight check in (admission, end], minimum one → an N-night stay bills N nights. Edge agreed (decision A): a check on the admission day itself is counted — the patient is charged for the night they were admitted in (pinned by a unit test). The rule lives solely in `computeBedFeeChargeInstants`.
- **Discharge-day finalisation — done.** `BedFeeCharger` now also recomputes admission encounters discharged within the last ~25h (`endDate IS NULL OR endDate >= now − 25h`), so the final discharge-day night lands even for off-hour check times and death discharges. Recompute is idempotent, so re-processing is harmless.

**Resolved (excluded):**
- **65+ bed-fee stop — excluded, confirmed by PM.** No age-based stop on the bed fee; age is not checked for bed-fee purposes.

**Still open:**
- Integration tests (location attribution, placeholder, batching) not yet run against a live DB.
