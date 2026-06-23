# FSM Encounter Fees — Build Order & Shared Foundation

How the four encounter-fee tickets fit together, the shared groundwork they sit on, and the order to build them. Product behaviour lives in the PRD and Tech Design docs; this is the engineering sequencing layer that the per-ticket plans hang off.

## Tickets

- **TAM-6898** Outpatient + ED encounter fees — carries most of the foundation; build first.
- **TAM-6900** Inpatient bed fee — adds bed-as-product + nightly job; needs the foundation.
- **TAM-6913** FSM ward-price scenario — refines 6900's night counting; build after 6900.
- **TAM-6901** Inpatient fee inclusions/exclusions — independent of the fee *products*; needs only the facility-settings block, so it can run in parallel once that lands.

## Build order

1. **Foundation** (inside 6898): invoice-item categories + source types, the facility-settings block, the fee-selection helper, and integration at the invoice auto-create chokepoint.
2. **6898** — outpatient (standard / after-hours / weekend) + ED fee.
3. **6900** — bed fee (BED_FEE category, Location-as-product, recompute method, nightly job).
4. **6913** — distinct-location-per-night counting on top of 6900.
5. **6901** — per-facility category exclusion in the clinical-item auto-add paths (parallelisable once the settings block exists).

## Shared foundation (grounded in code)

### How a fee attaches to an invoice

`Invoice.addItemToInvoice(sourceRecord, encounterId, invoiceProduct, orderedByUserId?, { quantity, note })` (`packages/database/src/models/Invoice/Invoice.ts:189`) upserts an `InvoiceItem` keyed on `(invoice_id, source_record_type, source_record_id)`, where `source_record_type`/`id` come from `sourceRecord.getModelName()` / `.id()`. This upsert is the idempotency anchor every fee relies on:

- **Encounter fee** → source record is the **Encounter** → one line per encounter.
- **Bed fee** → source record is the **Location** → one line per location, `quantity` = nights (batched by location, exactly as the PRD wants).

The fee *amount* is never written on the line — it comes from the price list via the `invoiceProduct`, resolved by `InvoicePriceList.getIdForPatientEncounter(encounterId)` (`InvoicePriceList.ts:71`) and read through `getInvoiceItemPrice` (`packages/utils/src/invoice/invoiceItem.ts:9`). So per-facility / age / insurance pricing comes for free.

### New invoice categories & source types

- Add to `INVOICE_ITEMS_CATEGORIES` (`packages/constants/src/invoices.ts:24`): `ENCOUNTER_FEE: 'EncounterFee'` and `BED_FEE: 'BedFee'`, plus matching entries in `INVOICE_ITEMS_CATEGORIES_MODELS` and `INVOICE_ITEMS_CATEGORY_LABELS`.
- **Encounter-fee products** point at a new `encounterFee` **reference-data** type — reuse the existing `sourceRefDataRecord` resolution in `InvoiceProduct.getSourceRecord()` (`InvoiceProduct.ts:98`), so map `ENCOUNTER_FEE → ReferenceData`.
- **Bed-fee products** point at a **Location** — add a `belongsTo(Location)` association + a `getSourceRecord()` case, mapping `BED_FEE → Location`.
- Extend the `InvoiceItemSourceRecord` union (`Invoice.ts:25`) with **Encounter** and **Location** so each can be a line source; confirm both expose `getModelName()` / `id()`.

### Where fees get added

Every encounter-creation path already calls `Invoice.automaticallyCreateForEncounter(encounterId, encounterType, date, settings, options)` (`Invoice.ts:261`) right after `Encounter.create()` — the clinic/triage route (`facility-server/app/routes/apiv1/encounter.js:85`) and the walk-in-pharmacy route (`.../medication.js:536`). That return value (the new invoice, or `null` when invoicing is off / the type is excluded) is the single chokepoint: add the encounter fee there via a shared helper. The idempotent upsert makes re-runs and re-syncs safe.

> **"A removed fee must not be re-added."** The helper must skip when a line for this encounter already exists **including soft-deleted** — a plain upsert would otherwise resurrect a fee a cashier deliberately removed. This guard is foundation-level and shared by every fee.

### Facility-scoped settings

Invoicing on/off stays **global** (`features.invoicing.enabled`, `packages/settings/src/schema/global.ts`). The per-state behaviour goes in a new **facility-scoped** block in `packages/settings/src/schema/facility.ts`, read via `Setting.get(key, facilityId)` / `ReadSettings`:

- normal-hours window (start/end, weekend handling) — 6898
- charge encounter fee for pharmacy walk-in encounters (boolean) — 6898
- overnight bed-fee check time (default `02:00`) — 6900
- bundled inpatient categories — 6901

### Timezone

Stored datetimes are in the **primary** timezone. All fee time-of-day logic (hours bucketing, the overnight check) must convert to **facility-local** time first — see the multi-timezone section of `llm/project-rules/coding-rules.md`.
