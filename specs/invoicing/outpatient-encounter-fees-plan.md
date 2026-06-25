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
- [x] Call the helper at each invoice auto-create site (`encounter.js`, `medication.js`)

### 6898-specific

- [x] Standard / after-hours / weekend bucketing computed in facility-local time (unit-tested incl. near-midnight TZ edge)
- [x] ED fee: emergency family selects the ED product at creation
- [ ] Confirm directly-admitted-from-ED keeps the ED fee (design holds — anchored at triage creation; needs an integration test)

### Pharmacy walk-in — RE-SPECCED to department-based (rework pending)

**Design changed** (see Tech Design "Walk-in pharmacy vs regular clinic — fee varies by Department"): the encounter fee now varies by **Department** via the price-list engine, not an `isPharmacyEncounter` flag. The walk-in pharmacy encounter's dedicated department (`medications.medicationDispensing.automaticEncounterDepartmentId`) is the discriminator.

Build steps (department model):
- [ ] Add `departmentId` as a price-list rule dimension — match it in `InvoicePriceList.getIdForPatientEncounter` (`equalsIfPresent(rules.departmentId, …)`, loading the encounter's department) and expose it in the price-list importer/config
- [ ] Make `Invoice.addEncounterFee` honour the matching price list — skip when the encounter-fee product is hidden/absent for that price list (the check `addItemToInvoice` already makes), so a department can skip the fee
- [ ] Config: a facility that doesn't charge pharmacy scopes a price list to the pharmacy department with the encounter-fee product hidden

Rework — back out the flag-based first cut:
- [ ] Drop `isPharmacyEncounter` (model field + Sequelize migration `1782100000000` + mobile TypeORM migration `1782292366000`) and the `medication.js` set
- [ ] Drop `invoicing.encounterFee.chargePharmacyEncounterFee` and the pharmacy params on `selectEncounterFeeCode`

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

**Pharmacy walk-in — design superseded (rework pending):** the first cut shipped the `isPharmacyEncounter` flag (server migration `1782100000000` + mobile migration `1782292366000`, the pharmacy-route set, the selector params, and the `chargePharmacyEncounterFee` setting). Per the updated Tech Design this is replaced by the **department-based** model (see the Pharmacy walk-in build steps above) — the flag-based code needs backing out.

**Deferred (clean follow-ups):**
- **dbt source models:** the new `encounters.is_pharmacy_encounter` column needs the dbt model regenerated (`npm run dbt-generate-model` + fill TODOs) per `packages/database/CLAUDE.md` — not run here (needs the dbt/DB setup).
- **Integration tests:** endpoint test for the add path (create encounter → one line; re-run → still one; remove → not re-added; `$0` line; pharmacy charge vs skip).
- **Config-guide:** data admins must create `encounterFee` reference data with codes `encounterFeeStandard` / `encounterFeeAfterHours` / `encounterFeeWeekend` / `encounterFeeEmergency` and price them per facility via price lists.

## Risks / open

- Pharmacy walk-in is now spec'd as **department-based** (fee varies by Department via the price list); the flag-based first cut is pending rework. See the Pharmacy walk-in section.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
