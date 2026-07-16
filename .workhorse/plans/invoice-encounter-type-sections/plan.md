# Invoice sections by encounter type

Tech-design working notes. Placeholder id `invoice-encounter-type-sections` (no Linear card yet). Branch `feat/invoice-encounter-type-sections`, based on `epic-fsm-invoicing`.

## Problem

A single encounter can move through several encounter types over its life (for example triage → active ED → observation → admission). Today every charge on that encounter's invoice lands in one flat list with nothing to show which phase of care it belongs to. Cashiers and patients can't see what was incurred under ED versus inpatient care, and it doesn't reflect how the fees are already structured per encounter type (ED encounter fee, inpatient bed fee, bundled inpatient categories).

Goal: group the invoice into a section per encounter-type phase, each showing its own items (and, TBD, a subtotal), so the invoice reads as the story of the stay.

## Context (what exists today)

- **One invoice per encounter** (`Invoice.encounterId`); the encounter's `encounterType` changes in place, and each change is captured in the audit changelog (`logs.changes`) as a full-row JSONB snapshot.
- Invoice items are a **flat list** everywhere they render: web `InvoiceForm.jsx` (`values.invoiceItems.map`), the PDF `packages/shared/.../patientCertificates/InvoiceRecordPrintout.jsx`, both via `Invoice.getFullReferenceAssociations`.
- `InvoiceItem` records `orderDate`, `sourceRecordType`/`sourceRecordId`, `productId`, `orderedByUserId` — **no encounter-type-at-order field**. The encounter's type over time is recorded in the audit changelog (`logs.changes`), which is synced and always-on.
- Fee taxonomy is already defined in `specs/invoicing/encounter-fees.md`: **Outpatient** (clinic, imaging), **Emergency** (triage / active ED / short-stay), **Inpatient** (admission); vaccination & form-response carry no fee.
- Spec principle already in force: *"existing items are not re-evaluated when the encounter type changes… pre-admission items keep their full price and are not retro-bundled."* So an item conceptually belongs to the phase it was added in.
- On finalisation, item display fields are frozen (`productNameFinal`, `priceFinal`, etc.).

## Open design decisions

Captured below as they're resolved.

### 1. Attribution mechanism — how each item maps to a phase

**Decided: store the encounter type on the invoice item itself, set once when the item is created, and group sections by that stored value.** The value is decided at creation and never recomputed — robust, and faithful to the spec principle that an item belongs to the phase it was added in.

Rejected:
- *Derive at render by time-matching the item's `orderDate` against encounter state over time* — not robust: fragile to gaps/edits and can retroactively re-section a finalised invoice.
- *Anything built on `EncounterHistory`* — that model is **deprecated**, so it's out as both a link target and a derivation source (including for backfill).

Shape:
- New column on `invoice_items`, e.g. `encounter_type` (the `ENCOUNTER_TYPES` enum value). It's a stored value, not an FK — encounter types are an app enum, not reference data, so there's nothing to point a foreign key at.
- Set at creation from the invoice's encounter's **current** `encounterType`, at every creation path: the `addItemToInvoice` chokepoint (auto-added clinical items), `addEncounterFee`, `recalculateBedFee`, and the manual invoice PUT route (cashier-added items).
- **Editable after creation** (a related feature request): a cashier can change an item's encounter type, so the invoice-item edit path (the invoice PUT route + item edit UI) must accept and persist `encounterType`, and it re-buckets into the matching section. This is another reason a stored value beats a derived link — the override lives on the item.
- `invoice_items` is already bidirectionally synced, so the column just travels with the row — no new model, no sync-filter work. Mobile has no invoice tables, so no mobile migration. dbt `invoice_items` model needs the new column documented.
- Grouping granularity (raw type vs fee-family) is a **render-time** decision on top of the stored raw type — see decision 2.

**Backfill (decided): reconstruct from the changelog.** For each existing `invoice_item`, set `encounter_type` to the encounter's type as-of when the item was created — the latest `logs.changes` row for `(table_name='encounters', record_id=encounterId)` with `logged_at <= invoice_item.created_at`, taking `record_data->>'encounter_type'`. Notes:
- Match on the item's **`created_at`** (a precise timestamp), not `order_date` (which is date-only) — `created_at` best approximates the phase the item was added in.
- Fallback where no changelog row precedes the item (pre-audit rows, or item created before the encounter's first logged change): use the encounter's earliest known type from the changelog, else its current `encounter_type`.
- The changelog fallback (current type where no earlier change is logged) guarantees the backfill leaves **no nulls**, which is what lets the column be `NOT NULL` (below).
- Stakes are low regardless — invoicing is unreleased, so this only touches test data — but the changelog reconstruction is the accurate choice the team wants and sets the pattern.

**Nullability (decided): `NOT NULL`, with the encounter's current type as the fallback.** Every creation path has the encounter in hand and `encounters.encounter_type` is itself non-null, so new items always get a real value; the backfill's current-type fallback covers existing rows. Consequences:
- **Migration is three steps** (all separate per the DDL/DML rule): (1) DDL add the column nullable, (2) DML changelog backfill (fallback guarantees no nulls remain), (3) DDL flip to `NOT NULL`.
- **Removes the "Other" section** — every item has a real type, so there's no null bucket to render (see decision 3).
- Accepted trade-off: the fallback can mislabel a pre-audit multi-phase item (old ED-phase item → current "admission" type), but that only fires on rows with no earlier changelog entry, and invoicing is unreleased so no such data exists; going forward every item gets its true creation-time type.
- Assumes every invoice has an encounter (holds today — `createInvoiceSchema` requires `encounterId`); the `NOT NULL` flip is a loud tripwire if that ever isn't true.

### 1a. Valid encounter types for an encounter (for the edit dropdown)

When a cashier edits an item's encounter type, the choices should be constrained to the types the encounter has actually been through — not the whole enum. **Source: the audit changelog** (`logs.changes`, model `ChangeLog`), which is the robust, non-deprecated record of encounter state over time and, importantly, **travels with sync** (`attachChangelogToSnapshotRecords` on push / `insertChangelogRecords` on incoming), so a facility server holds the full change history for encounters it owns.

`ChangeLog.recordData` is a JSONB snapshot of the full row at each change, so the distinct set of types is:

```sql
SELECT DISTINCT record_data->>'encounter_type'
FROM logs.changes
WHERE table_name = 'encounters' AND record_id = :encounterId;
```

unioned with the encounter's current `encounterType` (belt-and-braces). A facility-server endpoint exposes this list for the edit UI. Confirmed the changelog is reliable to depend on: the `audit.changes.enabled` setting was retired (`1778000000000-retireAuditChangesEnabledSetting`) and `logs.is_audit_changes_enabled()` now returns true except during a transient `AUDIT_PAUSE_KEY` pause (bulk migrations) — so encounter-type changes are always logged.

### 2. Section granularity — fee family vs raw encounter type

**Decided: group by raw encounter type** — one section per actual type present on the invoice (Triage, Emergency, Observation, Admission, Clinic, …). Keeps the section a cashier picks in the edit dropdown consistent with the section the item lands in (edit → "Observation" ⇒ shows under an "Observation" section), rather than collapsing several types into a fee-family bucket. Section labels come from the existing encounter-type labels/translations.

### 3. Rendering

- **Surfaces (decided): web invoice view + edit form, and the PDF printout.** The patient portal does not show invoices, so it's out of scope.
- **Per-section subtotals (decided): yes.** Each section shows a subtotal of its line totals; the existing grand total is unchanged. Much of the value is seeing "ED cost vs admission cost".
- **Section order (decided): chronological**, by each section's earliest item (order date, tie-broken by `created_at`), so it reads triage → ED → observation → admission without needing an explicit progression list.
- **No default/"Other" section** — the `encounter_type` column is `NOT NULL` (decision 1), so every item resolves to a real encounter-type section. (Earlier a trailing "Other" bucket was planned for null types; the non-nullable decision removes the need, and the related PO question is moot.)
- Grouping is presentation-only: the web form keeps one underlying `invoiceItems` array for form state and groups by `encounter_type` for display; the PDF groups the same way. No backend grouping endpoint needed — items already arrive via `getFullReferenceAssociations`; subtotals are computed where the totals already are.

### 4. Finalisation & sync

- **No `encounterTypeFinal` snapshot field needed (confirmed).** Unlike `productNameFinal` / `priceFinal`, which snapshot *mutable* product/price-list references at finalisation, `encounter_type` is a static value written to the item at creation and only cashier-editable while the invoice is in progress. Once finalised there's no edit path, so the stored value is already frozen.
- **Sync:** the new column rides on `invoice_items` (already bidirectional, encounter-linked). No new model or sync-filter work. The edit is an ordinary field update that syncs like any other item edit.

## Implementation surface (notes, not a checklist yet)

- **DB:** three migrations — (1) DDL add `invoice_items.encounter_type` nullable, (2) DML changelog backfill (current-type fallback leaves no nulls), (3) DDL flip to `NOT NULL`. Update the dbt `invoice_items` model + docs. No mobile migration (mobile has no invoice tables).
- **Model:** declare `encounterType` on `InvoiceItem`; include it in the invoice PUT route schema so edits persist.
- **Write paths that set it at creation:** `addItemToInvoice` (chokepoint for auto-added clinical items), `addEncounterFee`, `recalculateBedFee`, and the manual invoice PUT route — each reads the invoice's encounter's current `encounterType`.
- **Valid-types endpoint:** facility-server route returning the encounter's distinct historical types from `logs.changes` (query in §1a) ∪ current type, for the edit dropdown.
- **Web:** group `InvoiceForm` rows into sections with subtotals; add the encounter-type edit control (dropdown constrained to the valid-types list); mirror grouping in the invoice view.
- **PDF:** section `InvoiceRecordPrintout` with per-section subtotals.

## Related work / sequencing

This design deliberately covers **two** related asks together, because they share the same column and edit path:
1. Sectioning the invoice by encounter type (the original request).
2. Editing an item's encounter type after creation (the related feature request the user raised).

They could still ship as two cards (the column + creation-time set + sectioning first; the edit control second), but the data model is common to both. Decide card split when breaking this down.
