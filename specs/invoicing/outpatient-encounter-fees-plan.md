# Outpatient & ED Encounter Fees — Implementation Plan (TAM-6898)

Auto-add a per-facility encounter fee at encounter start: outpatient (`clinic`) bucketed by start time into standard / after-hours / weekend, plus a single ED fee for the emergency family (`triage` / `emergency` / `observation`) added once at creation. This ticket carries the shared fee-engine foundation — see `fee-engine-build-order.md`.

## Technical approach

- Fee products are reference-data-backed `InvoiceProduct`s (category `ENCOUNTER_FEE`), one per bucket, identified by stable codes; the per-facility amount comes from the price list.
- A selector maps `(encounter family, start time in facility-local TZ)` → fee code:
  - `clinic`, weekday 08:00–17:00 → **standard** (Fee A)
  - `clinic`, weekday outside that → **after-hours** (Fee B)
  - `clinic`, weekend window (Fri 17:01 → Mon 07:59) → **weekend** (Fee C); B and C can point at the same product where a state doesn't distinguish them
  - `triage` / `emergency` / `observation` → **ED fee** (Fee Y)
- **Applicability and amount come from the price list.** A walk-in pharmacy encounter resolves a **separate flat pharmacy product** instead of a clinic fee (its dedicated department is the discriminator; no encounter flag). Charging pharmacy is opt-in: an unpriced pharmacy product → **no fee**, which is how it's skipped at facilities that don't charge it.
- The fee is added **once, at encounter start**, at the invoice auto-create chokepoint. Adding at start (not discharge) survives the end-of-day clinic auto-discharge, which only sets `endDate` (`shared/src/utils/dischargeOutpatientEncounters.js`). Anchored on the Encounter → idempotent; never recomputed.

## Build steps

### Foundation (shared — detail in build-order doc)

- [x] Add `ENCOUNTER_FEE` category + maps (`constants/src/invoices.ts`)
- [x] Add `Encounter` to the `InvoiceItemSourceRecord` union (`Invoice.ts`)
- [x] Add the `encounterFee` reference-data type; map `ENCOUNTER_FEE → ReferenceData` (`importable.ts`, `invoices.ts`, `InvoiceProduct.ts`)
- [x] Add the facility-settings block + standard-hours window schema (`settings/src/schema/facility.ts`)
- [x] Build the fee-selection helper: `(family + facility-local time-of-day) → fee code` (`utils/src/invoice/encounterFee.ts`, unit-tested)
- [x] Build the add-encounter-fee helper: skip if a line (incl. soft-deleted) already exists; resolve product by code with weekend→after-hours fallback (`Invoice.addEncounterFee`)
- [x] Call the helper at each invoice auto-create site (`encounter.js`, `medication.js`)

### 6898-specific

- [x] Standard / after-hours / weekend bucketing computed in facility-local time (unit-tested incl. near-midnight TZ edge)
- [x] ED fee: emergency family selects the ED product at creation
- [ ] Confirm directly-admitted-from-ED keeps the ED fee (design holds — anchored at triage creation; needs an integration test)

### Pharmacy walk-in — DONE (separate product)

The walk-in pharmacy encounter charges a **separate flat pharmacy fee product** (`pharmacyEncounterFee` reference data, code `encounterFeePharmacy`) instead of a clinic fee, priced on the same facility price list. `Invoice.addEncounterFee` compares the encounter's `departmentId` to the configured pharmacy department (`medications.medicationDispensing.automaticEncounterDepartmentId`); a match resolves the pharmacy product, otherwise the clinic selector runs.

- [x] New `PharmacyEncounterFee` invoice category + `pharmacyEncounterFee` reference type + maps (`constants`, `InvoiceProduct.ts`)
- [x] `addEncounterFee` branches on the pharmacy department; pharmacy charging is **opt-in** — only adds the line where the pharmacy product has a visible price-list item (unpriced → no line)
- [x] Reverted the `departmentId` price-list rule dimension (no department-scoped price list to manage)
- [x] Earlier cuts backed out: the `isPharmacyEncounter` flag (model field + server/mobile migrations + entity/type + the `medication.js` set), the `chargePharmacyEncounterFee` setting, the selector's pharmacy params
- [x] Config (data admin): import the `pharmacyEncounterFee` product; price it to charge, leave it unpriced to skip

### Tests

- [x] Bucketing incl. near-midnight facility-local TZ edge (unit test)
- [x] One-line-per-encounter idempotency across re-run / re-sync (integration)
- [x] A cashier-removed fee is not re-added (integration)
- [x] Pharmacy fee: charged when the product is priced, skipped when unpriced (integration)

## Implementation status — 2026-06-24

Branch `feature/tam-6898-featinvoicing-outpatient-encounter-fees` (off `epic-fsm-invoicing`), three commits.

**Done & verified** — unit tests green (8/8), `@tamanu/database` build passes, lint clean:
- Constants + stable fee codes; facility `invoicing.encounterFee` settings.
- Pure `selectEncounterFeeCode` selector + unit tests (bucketing, inclusive boundaries, weekend window, facility-local TZ, non-fee types).
- `encounterFee` + `pharmacyEncounterFee` reference types + product source resolution + `Encounter` as an invoice-item source.
- `Invoice.addEncounterFee` (branching clinic vs pharmacy product), wired into the encounter / triage / medication creation routes.

**DB-verified** — `EncounterFee.test.js` runs against a live DB (8 cases): standard/ED bucketing, non-invoiceable type, idempotency, cashier-removed-not-re-added, clinic-vs-pharmacy product selection, and pharmacy charged-when-priced / skipped-when-unpriced.

**Pharmacy walk-in — separate product (done):** a flat `pharmacyEncounterFee` product, selected when the encounter is in the configured pharmacy department, priced on the same facility price list. Charging is opt-in (unpriced → no line). The `departmentId` price-list dimension and the earlier `isPharmacyEncounter` flag / `chargePharmacyEncounterFee` setting have all been backed out. No DB column added, so no dbt change.

**Deferred (clean follow-ups):**
- **Config-guide:** data admins create `encounterFee` reference data (codes `encounterFeeStandard` / `encounterFeeAfterHours` / `encounterFeeWeekend` / `encounterFeeEmergency`) and a `pharmacyEncounterFee` product (code `encounterFeePharmacy`), priced per facility via price lists. (Done — see `configuration-guide.md`.)

## Risks / open

- Pharmacy walk-in is **department-based** (fee varies by Department via the price list) and implemented; the flag has been backed out.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
