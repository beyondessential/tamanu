# Outpatient & ED Encounter Fees — Implementation Plan (TAM-6898)

Auto-add a per-facility encounter fee at encounter start: outpatient (`clinic`) bucketed by start time into standard / after-hours / weekend, plus a single ED fee for the emergency family (`triage` / `emergency` / `observation`) added once at creation. This ticket carries the shared fee-engine foundation — see `fee-engine-build-order.md`.

## Technical approach

- Fee products are reference-data-backed `InvoiceProduct`s (category `ENCOUNTER_FEE`), one per bucket, identified by stable codes; the per-facility amount comes from the price list.
- A selector maps `(encounter family, start time in facility-local TZ, [pharmacy flag])` → fee code:
  - `clinic`, weekday 08:00–17:00 → **standard** (Fee A)
  - `clinic`, weekday outside that → **after-hours** (Fee B)
  - `clinic`, weekend window (Fri 17:01 → Mon 07:59) → **weekend** (Fee C); B and C can point at the same product where a state doesn't distinguish them
  - `triage` / `emergency` / `observation` → **ED fee** (Fee Y)
  - `clinic` with `isPharmacyEncounter` at a facility that doesn't charge pharmacy → **no fee** (skip); otherwise a pharmacy walk-in gets the normal clinic bucket (no separate product)
- The fee is added **once, at encounter start**, at the invoice auto-create chokepoint. Adding at start (not discharge) survives the end-of-day clinic auto-discharge, which only sets `endDate` (`shared/src/utils/dischargeOutpatientEncounters.js`). Anchored on the Encounter → idempotent; never recomputed.

## Build steps

### Foundation (shared — detail in build-order doc)

- [x] Add `ENCOUNTER_FEE` category + maps (`constants/src/invoices.ts`)
- [x] Add `Encounter` to the `InvoiceItemSourceRecord` union (`Invoice.ts`)
- [x] Add the `encounterFee` reference-data type; map `ENCOUNTER_FEE → ReferenceData` (`importable.ts`, `invoices.ts`, `InvoiceProduct.ts`)
- [x] Add the facility-settings block + standard-hours window schema (`settings/src/schema/facility.ts`)
- [x] Build the fee-selection helper: `(family + facility-local time-of-day) → fee code` (`utils/src/invoice/encounterFee.ts`, unit-tested)
- [x] Build the add-encounter-fee helper: skip if a line (incl. soft-deleted) already exists; resolve product by code with weekend→after-hours fallback (`Invoice.addEncounterFee`)
- [~] Call the helper at each invoice auto-create site — **encounter route done** (`encounter.js`); pharmacy route (`medication.js`) deferred with the pharmacy flag

### 6898-specific

- [x] Standard / after-hours / weekend bucketing computed in facility-local time (unit-tested incl. near-midnight TZ edge)
- [x] ED fee: emergency family selects the ED product at creation
- [ ] Confirm directly-admitted-from-ED keeps the ED fee (design holds — anchored at triage creation; needs an integration test)

### Pharmacy walk-in — DEFERRED (charge-or-skip, no separate products)

Resolved design (Pohnpei skips pharmacy, Yap charges the same, no state prices differently). The facility toggle is in place; the discriminator flag + its migrations are the remaining work.

- [x] Add the facility setting `invoicing.encounterFee.chargePharmacyEncounterFee` (boolean, default `true`)
- [ ] Add `isPharmacyEncounter` boolean to `encounters` (Sequelize **and** mobile TypeORM migration — `encounters` syncs); set `true` in the walk-in-pharmacy route (`medication.js` create ~520), immutable thereafter
- [ ] Pass `isPharmacyEncounter` + `chargePharmacyEncounterFee` into `selectEncounterFeeCode` in `Invoice.addEncounterFee` (the selector already supports both), and wire `addEncounterFee` into the pharmacy route after invoice auto-create

### Tests

- [x] Bucketing incl. near-midnight facility-local TZ edge (unit test)
- [ ] One-line-per-encounter idempotency across re-run / re-sync (integration)
- [ ] A cashier-removed fee is not re-added (integration)
- [ ] A `$0` product renders as a `$0` line item (integration)

## Implementation status — 2026-06-24

Branch `feature/tam-6898-featinvoicing-outpatient-encounter-fees` (off `epic-fsm-invoicing`), three commits.

**Done & verified** — unit tests green (8/8), `@tamanu/database` build passes, lint clean:
- Constants + stable fee codes; facility `invoicing.encounterFee` settings.
- Pure `selectEncounterFeeCode` selector + unit tests (bucketing, inclusive boundaries, weekend window, facility-local TZ, pharmacy-skip, non-fee types).
- `encounterFee` reference type + product source resolution + `Encounter` as an invoice-item source.
- `Invoice.addEncounterFee` / `resolveEncounterFeeProduct`, wired into the encounter creation route.

**Not yet runtime/DB-verified** — no integration test was run against a live DB. Add an endpoint test: create encounter → assert one fee line at the configured price; re-run → still one; remove → not re-added; `$0` product → `$0` line.

**Deferred (clean follow-ups):**
- **Pharmacy walk-in:** add the `isPharmacyEncounter` column (server Sequelize + mobile TypeORM migration), set it in the pharmacy route, pass it + the existing toggle into the selector, and wire `addEncounterFee` into `medication.js`. The selector and the facility toggle already support this — only the column + wiring remain. (Until then, a pharmacy walk-in at a charging facility behaves like a normal clinic visit; at a non-charging facility the skip isn't applied yet.)
- **Config-guide:** data admins must create `encounterFee` reference data with codes `encounterFeeStandard` / `encounterFeeAfterHours` / `encounterFeeWeekend` / `encounterFeeEmergency` and price them per facility via price lists.

## Risks / open

- Pharmacy walk-in handling is resolved (above): the `isPharmacyEncounter` flag is needed as a discriminator, but no separate fee products — a facility toggle decides charge-or-skip.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
