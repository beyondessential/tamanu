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

- [ ] Add `ENCOUNTER_FEE` category + maps (`constants/src/invoices.ts:24`)
- [ ] Add `Encounter` to the `InvoiceItemSourceRecord` union; confirm `getModelName()`/`id()` (`Invoice.ts:25`, `Encounter.ts`)
- [ ] Add the `encounterFee` reference-data type; map `ENCOUNTER_FEE → ReferenceData` in product resolution (`InvoiceProduct.ts:98`, constants)
- [ ] Add the facility-settings block + normal-hours window schema (`settings/src/schema/facility.ts`)
- [ ] Build the fee-selection helper: `(family + facility-local time-of-day) → fee code`, reading the per-facility hours window
- [ ] Build the add-encounter-fee helper: look up the `InvoiceProduct` by code, call `addItemToInvoice(encounter, …)`; **skip if a line (incl. soft-deleted) already exists for this encounter**
- [ ] Call the helper at each invoice auto-create site (`encounter.js:85`, `medication.js:536`) — or fold it into `automaticallyCreateForEncounter`

### 6898-specific

- [ ] Standard / after-hours / weekend bucketing computed in facility-local time, weekend window configurable
- [ ] ED fee: emergency family selects the ED product at creation
- [ ] Confirm directly-admitted-from-ED keeps the ED fee (anchored at triage creation; a later type change doesn't remove it)

### Pharmacy walk-in — RESOLVED (charge-or-skip, no separate products)

Pohnpei charges regular clinic but **skips** the fee for pharmacy walk-ins; Yap charges both the same; no other state differs. So the distinction is binary — charge the normal clinic fee or skip it — **not** a different price. We need to tell pharmacy walk-ins apart from regular clinic encounters, but **not** a parallel (mostly $0) set of pharmacy products.

- [ ] Add `isPharmacyEncounter` boolean to `encounters` (Sequelize **and** mobile TypeORM migration — `encounters` syncs); set `true` in the walk-in-pharmacy route (`medication.js` create call ~520), immutable thereafter
- [ ] Add the facility setting, e.g. `invoicing.chargePharmacyEncounterFee` (boolean, default `true`) — Yap `true`, Pohnpei `false`
- [ ] Fee helper: for a `clinic` encounter, if `isPharmacyEncounter` and the facility setting is off → **skip the fee**; otherwise apply the normal clinic fee bucket (same products as a regular clinic visit)

### Tests

- [ ] Bucketing incl. near-midnight facility-local TZ edge
- [ ] One-line-per-encounter idempotency across re-run / re-sync
- [ ] A cashier-removed fee is not re-added
- [ ] A `$0` product renders as a `$0` line item

## Risks / open

- Pharmacy walk-in handling is resolved (above): the `isPharmacyEncounter` flag is needed as a discriminator, but no separate fee products — a facility toggle decides charge-or-skip.
- "Removed fee not re-added" hinges on the soft-delete-aware guard; get it right at the foundation level.
