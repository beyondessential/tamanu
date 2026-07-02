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

- [ ] Add `BED_FEE` category + maps (`constants/src/invoices.ts:24`)
- [ ] `InvoiceProduct`: `belongsTo(Location)` + `getSourceRecord()` case; map `BED_FEE → Location` (`InvoiceProduct.ts:98`)
- [ ] Add `Location` to the `InvoiceItemSourceRecord` union; confirm `getModelName()`/`id()` (`Invoice.ts:25`)
- [ ] Facility setting: overnight check time (default `02:00`), facility-local (`settings/src/schema/facility.ts`)

### Bed fee

- [ ] `recomputeBedFee(admissionEncounter)`: nights-per-location via `EncounterHistory`, upsert one line per Location, drop lines that fall to 0
- [ ] Night 1 on admission: trigger recompute when an encounter becomes `admission` (created-as-admission and `triage → admission` type change)
- [ ] Exclude placeholder / "open ward" locations (identify via location type or flag — confirm the signal)
- [ ] `BedFeeCharger` scheduled task (`central-server/app/tasks/`): run hourly; for each facility at its local check time, find currently-admitted encounters and recompute. Register in `tasks/index.js`; add config under `schedules` in `default.json5`. Batch + sleep; transaction per encounter (`DeceasedPatientDischarger` is the pattern)

### Tests

- [ ] Same-day admit / death / abscond = 1 night
- [ ] Multi-night accrual across overnight boundaries
- [ ] Location change picks the check-time location
- [ ] Placeholder location not charged
- [ ] Batching by location (e.g. ICU ×2, Ward 1 Bed 1 ×3)

## Risks / open

- Central scheduled jobs are **system-wide and primary-TZ — there is no per-facility scheduling** (`ScheduledTask`, `tasks/index.js`). The hourly-run + per-facility-local-check pattern is the workaround; the idempotent recompute makes over-running harmless. Validate it for facilities sharing the primary TZ vs facilities with a distinct TZ.
- The 65+ stop is **no longer a requirement** (Tech Design) — not implemented.
- No mobile migration expected — the bed fee is central/facility-side and adds no `encounters` column.
- Identifying "open ward" placeholder locations needs a concrete signal — confirm.
