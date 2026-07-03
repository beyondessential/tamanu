# Outpatient and ED encounter fees (TAM-6898)

Auto-add a per-facility encounter fee at encounter start: an outpatient (`clinic`) fee bucketed by start time into standard / after-hours / weekend, plus a single ED fee for the emergency family (`triage` / `emergency` / `observation`) added once at creation. This ticket carries the shared fee-engine foundation that the other encounter-fee tickets sit on.

Implements the outpatient / ED and walk-in-pharmacy sections of `spec: FEES`.

## Build order and dependencies

This is the first ticket to build — it carries the foundation (invoice-item categories + source types, the facility-settings block, the fee-selection helper, and integration at the invoice auto-create chokepoint). The other tickets depend on it:

- TAM-6900 (inpatient bed fee) adds bed-as-product + a nightly job on top of the foundation.
- TAM-6913 (ward-price scenario) refines 6900's night counting; build after 6900.
- TAM-6901 (inpatient fee inclusions/exclusions) needs only the facility-settings block, so it can run in parallel once that lands.

## Shared foundation

### How a fee attaches to an invoice

`Invoice.addItemToInvoice(sourceRecord, encounterId, invoiceProduct, orderedByUserId?, { quantity, note })` (`packages/database/src/models/Invoice/Invoice.ts:189`) upserts an `InvoiceItem` keyed on `(invoice_id, source_record_type, source_record_id)`, where `source_record_type`/`id` come from `sourceRecord.getModelName()` / `.id()`. This upsert is the idempotency anchor every fee relies on:

- **Encounter fee** → source record is the **Encounter** → one line per encounter.
- **Bed fee** → source record is the **Location** → one line per location, `quantity` = nights (batched by location).

The fee *amount* is never written on the line — it comes from the price list via the `invoiceProduct`, resolved by `InvoicePriceList.getIdForPatientEncounter(encounterId)` (`InvoicePriceList.ts:71`) and read through `getInvoiceItemPrice` (`packages/utils/src/invoice/invoiceItem.ts:9`). So per-facility / age / insurance pricing comes for free.

### New invoice categories & source types

- Add to `INVOICE_ITEMS_CATEGORIES` (`packages/constants/src/invoices.ts:24`): `ENCOUNTER_FEE: 'EncounterFee'`, `PHARMACY_ENCOUNTER_FEE: 'PharmacyEncounterFee'` and `BED_FEE: 'BedFee'`, plus matching entries in `INVOICE_ITEMS_CATEGORIES_MODELS` and `INVOICE_ITEMS_CATEGORY_LABELS`.
- **Encounter-fee products** point at the `encounterFee` / `pharmacyEncounterFee` **reference-data** types — reuse the existing `sourceRefDataRecord` resolution in `InvoiceProduct.getSourceRecord()`, so map both to `ReferenceData`.
- Extend the `InvoiceItemSourceRecord` union (`Invoice.ts:25`) with **Encounter** (and **Location**, used by 6900) so each can be a line source; confirm they expose `getModelName()` / `id()`.

### Where fees get added

Every encounter-creation path already calls `Invoice.automaticallyCreateForEncounter(encounterId, encounterType, date, settings, options)` (`Invoice.ts:261`) right after `Encounter.create()` — the clinic/triage route (`facility-server/app/routes/apiv1/encounter.js:85`) and the walk-in-pharmacy route (`.../medication.js:536`). That return value (the new invoice, or `null` when invoicing is off / the type is excluded) is the single chokepoint: add the encounter fee there via a shared helper. The idempotent upsert makes re-runs and re-syncs safe.

> **"A removed fee must not be re-added."** The helper must skip when a line for this encounter already exists **including soft-deleted** — a plain upsert would otherwise resurrect a fee a cashier deliberately removed. This guard is foundation-level and shared by every fee.

### Facility-scoped settings

Invoicing on/off stays **global** (`features.invoicing.enabled`, `packages/settings/src/schema/global.ts`). The per-state behaviour goes in a new **facility-scoped** block in `packages/settings/src/schema/facility.ts`, read via `Setting.get(key, facilityId)` / `ReadSettings`:

- normal-hours window (start/end, weekend handling) — this ticket
- overnight bed-fee check time (default `02:00`) — TAM-6900
- bundled inpatient categories — TAM-6901

### Timezone

Stored datetimes are in the **primary** timezone. All fee time-of-day logic (hours bucketing, the overnight check) must convert to **facility-local** time first — see the multi-timezone section of `llm/project-rules/coding-rules.md`.

## Technical approach

- Fee products are reference-data-backed `InvoiceProduct`s (category `ENCOUNTER_FEE`), one per bucket, identified by stable codes; the per-facility amount comes from the price list.
- A selector maps `(encounter family, start time in facility-local TZ)` → fee code:
  - `clinic`, weekday 08:00–17:00 → **standard** (Fee A)
  - `clinic`, weekday outside that → **after-hours** (Fee B)
  - `clinic`, weekend window (Fri 17:01 → Mon 07:59) → **weekend** (Fee C); B and C can point at the same product where a state doesn't distinguish them
  - `triage` / `emergency` / `observation` → **ED fee** (Fee Y)
- Applicability and amount come from the price list. A walk-in pharmacy encounter resolves a **separate flat pharmacy product** instead of a clinic fee (its dedicated department is the discriminator; no encounter flag). Charging pharmacy is opt-in: an unpriced pharmacy product → **no fee**, which is how it's skipped at facilities that don't charge it.
- The fee is added **once, at encounter start**, at the invoice auto-create chokepoint. Adding at start (not discharge) survives the end-of-day clinic auto-discharge, which only sets `endDate` (`shared/src/utils/dischargeOutpatientEncounters.js`). Anchored on the Encounter → idempotent; never recomputed.

## Build steps

### Foundation (shared)

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

### Pharmacy walk-in (separate product)

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

## Implementation notes

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

### Risks / open

- Pharmacy walk-in is **department-based** (fee varies by Department via the price list) and implemented; the flag has been backed out.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
