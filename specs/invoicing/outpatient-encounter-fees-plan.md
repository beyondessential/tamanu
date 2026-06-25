# Outpatient & ED Encounter Fees — Implementation Plan (TAM-6898)

Auto-add a per-facility encounter fee at encounter start: outpatient (`clinic`) bucketed by start time into standard / after-hours / weekend, plus a single ED fee for the emergency family (`triage` / `emergency` / `observation`) added once at creation. This ticket carries the shared fee-engine foundation — see `fee-engine-build-order.md`.

## Technical approach

- Fee products are reference-data-backed `InvoiceProduct`s (category `ENCOUNTER_FEE`), one per bucket, identified by stable codes; the per-facility amount comes from the price list.
- A selector maps `(encounter family, start time in facility-local TZ)` → fee code:
  - `clinic`, weekday 08:00–17:00 → **standard** (Fee A)
  - `clinic`, weekday outside that → **after-hours** (Fee B)
  - `clinic`, weekend window (Fri 17:01 → Mon 07:59) → **weekend** (Fee C); B and C can point at the same product where a state doesn't distinguish them
  - `triage` / `emergency` / `observation` → **ED fee** (Fee Y)
- **Applicability and amount come from the price list, which now matches on `departmentId` too.** A department whose price list hides the chosen fee product gets **no fee** — that's how walk-in pharmacy is skipped at facilities that don't charge it (its dedicated department is the discriminator; no encounter flag).
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

### Pharmacy walk-in — DONE (department-based)

The encounter fee varies by **Department** via the price-list engine, not an `isPharmacyEncounter` flag. The walk-in pharmacy encounter's dedicated department (`medications.medicationDispensing.automaticEncounterDepartmentId`) is the discriminator.

- [x] `departmentId` as a price-list rule dimension — matched in `InvoicePriceList.getIdForPatientEncounter` (`equalsIfPresent(rules.departmentId, encounter.departmentId)`). Rules are free-form JSON, so no schema/importer change was needed
- [x] `Invoice.addEncounterFee` honours the matching price list — skips when the encounter-fee product is hidden for that price list, so a department can skip the fee
- [x] Backed out the flag-based first cut: dropped `isPharmacyEncounter` (model field + server migration + mobile migration + entity/type + the `medication.js` set), the `chargePharmacyEncounterFee` setting, and the selector's pharmacy params
- [ ] Config (data admin): a facility that doesn't charge pharmacy scopes a price list to the pharmacy department with the encounter-fee product hidden

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

**Pharmacy walk-in — department-based (done):** the fee varies by Department via the price list (`departmentId` added to price-list rule matching; `addEncounterFee` skips a hidden fee product). The flag-based first cut (`isPharmacyEncounter` + its server/mobile migrations + the `chargePharmacyEncounterFee` setting) has been fully backed out. Verified: builds + lint + facility integration suites (EncounterInvoice / Medication / Encounter) pass. No DB column added, so no dbt change.

**Deferred (clean follow-ups):**
- **Integration tests:** endpoint test for the add path (create encounter → one line; re-run → still one; remove → not re-added; `$0` line; department-hidden → no line).
- **Config-guide:** data admins must create `encounterFee` reference data with codes `encounterFeeStandard` / `encounterFeeAfterHours` / `encounterFeeWeekend` / `encounterFeeEmergency` and price them per facility via price lists.

## Risks / open

- Pharmacy walk-in is **department-based** (fee varies by Department via the price list) and implemented; the flag has been backed out.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
