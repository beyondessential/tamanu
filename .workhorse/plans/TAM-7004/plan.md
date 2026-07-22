# TAM-7004: Apply deferrable constraints to uniqueness constraints

https://linear.app/bes/issue/TAM-7004/apply-deferrable-constraints-to-uniqueness-constraints

## Problem

During sync, a batch of incoming changes applies all creates before all updates
(`saveCreates` then `saveUpdates` in `packages/database/src/sync/saveChanges.ts`). This
causes spurious unique-constraint violations when a rename and a reuse of the freed-up
value land in the same sync batch, e.g.: central creates `report_definitions` row named
`cat`; facility syncs it down; central renames that row to `cat_deprecated` and creates a
*new* row named `cat`; the facility's next pull batch applies the create before the
rename, hitting a unique violation even though the end state is valid.

We solved the equivalent problem for self-referencing foreign keys
(`tasks.parent_task_id`, `invoice_payments.original_payment_id`) by making those FK
constraints `DEFERRABLE INITIALLY IMMEDIATE`, then setting them `DEFERRED` for the
duration of the sync-apply transaction via `withDeferredSyncSafeguards`
(`packages/database/src/sync/withDeferredSyncSafeguards.ts`). This ticket applies the
same idea to unique constraints.

## Scope

All unique constraints/indexes on syncable tables (`usesPublicSchema && syncDirection &&
syncDirection !== DO_NOT_SYNC`, the same test the FK guard test uses), not a curated
list — unlike self-referencing FKs, unique constraints exist on nearly every
reference-data-shaped table.

**29 constraints/indexes converted** to `DEFERRABLE INITIALLY IMMEDIATE`: 21 existing
`UNIQUE` constraints, plus 8 plain `CREATE UNIQUE INDEX`-only indexes promoted to
first-class constraints (Postgres can't defer a bare index — see the migration file for
the full list).

### Excluded, whitelisted in the guard test

- **3 `id`-only constraints** (`ai_documents_id_key`, `patient_ongoing_prescriptions_id_key`,
  `patient_program_registrations_id_key`) — `id` is the sync discriminator, so a
  duplicate indicates a real bug, not the rename/reuse ordering issue this ticket
  targets. `patient_program_registrations_id_key` is also an FK target; dropping it
  would need `CASCADE` (and the FK recreated).
- **`sync_lookup_record_id_record_type_uk`** — not actually a syncable table
  (`SyncLookup.syncDirection` is `DO_NOT_SYNC`; it's sync's own bookkeeping table), so
  never reaches the guard test's scan. Also used as an `ON CONFLICT ... DO UPDATE`
  arbiter in `updateLookupTable.js`, which would need rewriting regardless.
- **`patient_facilities_patient_id_facility_id_key`** — backs
  `INSERT ... ON CONFLICT (patient_id, facility_id) DO NOTHING` in
  `onCreateEncounterMarkPatientForSync.ts`. Postgres forbids deferrable constraints as
  `ON CONFLICT` arbiters; a `WHERE NOT EXISTS` rewrite avoids that restriction but
  introduces a real check-then-insert race under concurrent encounter creation for the
  same patient+facility pairing (confirmed via `__tests__/sync/integration/notes.test.js`,
  which creates encounters concurrently). Judged not worth the trade-off — left excluded.
- **6 partial/expression unique indexes** (`patient_invoice_insurance_plans`,
  `permissions` ×2, `settings` ×2, `user_preferences`) — Postgres can't make a partial or
  expression index deferrable at all; only a plain (full-table, column-list-only)
  `UNIQUE` constraint or an `EXCLUDE ... USING gist` constraint supports `DEFERRABLE`.
  Converting these needs the `btree_gist` extension — separate ticket (see Follow-ups).

`invoice_items_invoice_id_source_record_type_source_record_id_un` was also excluded
initially (used as an `ON CONFLICT ... DO UPDATE` arbiter via `InvoiceItem.upsert`'s
`conflictFields` in `Invoice.addItemToInvoice`), but is now converted — see below.

## Implementation

- **Migration**: `packages/database/src/migrations/1785000000000-makeUniqueConstraintsDeferrable.ts`,
  structured like `1771485087000-makeSelfReferencingFKDeferrable.ts` — explicit hardcoded
  arrays (not runtime introspection) of constraints/indexes to convert, `DROP` + `ADD
  CONSTRAINT ... DEFERRABLE INITIALLY IMMEDIATE`. `down()` reverses both. Verified `up`/
  `down`/`up` against a from-scratch local dev DB.
- **Runtime helper**: `withDeferredSyncSafeguards.ts`'s `getDeferrableConstraintNames`
  (renamed from `getDeferrableFKConstraintNames`) now queries `contype IN ('f', 'u')`
  instead of just `'f'`. No changes needed to `CentralSyncManager`/`FacilitySyncManager`
  call sites.
- **Guard test**: `packages/central-server/__tests__/sync/uniqueConstraintDeferrability.test.js`,
  mirroring `selfReferencingFkDeferrability.test.js` — fails CI with actionable
  instructions if any unique constraint/index on a syncable table isn't deferrable,
  except the whitelisted exclusions above.
- **Regression tests** proving the reported bug is fixed, using the ticket's own
  `ReportDefinition` rename/recreate example: two tests in `withDeferredSyncSafeguards.test.js`
  (succeeds with the deferral, throws a `SequelizeUniqueConstraintError` without it), and
  a full push-path test in `CentralSyncManager.deferredConstraints.test.js` (exercises
  `addIncomingChanges`/`completePush`).

### `Invoice.addItemToInvoice` rewrite

`InvoiceItem.upsert(..., { conflictFields })` was rewritten to `findOne({ paranoid: false })`
→ `update()`/`restore()` or `create()`, since `ON CONFLICT ... DO UPDATE` can't target a
deferrable constraint. Two bugs surfaced and were fixed during this work (both caught by
tests, not assumed):

1. A plain `.update({ deletedAt: null })` on a paranoid Sequelize instance does not clear
   `deletedAt` — needed an explicit `.restore()` first.
2. The find-then-write is itself a check-then-insert race under concurrent calls for the
   same `(invoice, source record)` pair — a real risk, not theoretical: `LabRequest`/
   `ImagingRequest`'s `afterUpdateHook` and `MedicationAdministrationRecordDose`'s hooks
   (via `Prescription.recalculateAndApplyInvoiceQuantity`) all funnel into
   `addItemToInvoice`, so two concurrent update requests for the same record race on the
   same key. `SELECT ... FOR UPDATE` doesn't fix this (it can't lock a row that doesn't
   exist yet). Fixed with a Postgres advisory lock (`pg_advisory_xact_lock`, keyed on
   `invoice.id + sourceRecordType + sourceRecordId`, wrapped in `sequelize.transaction()`
   so its scope matches the critical section) — the same pattern already used by
   `Device.acquireRegistrationLockForUser`.

Tests: `packages/central-server/__tests__/models/Invoice.addItemToInvoice.test.js` (create,
update-on-repeat, restore-from-soft-delete, concurrent-calls — 4 tests; the concurrency
test was confirmed to genuinely catch the regression by temporarily removing the lock).

Scanned the codebase for pre-existing coverage before adding these: no unit test called
`addItemToInvoice` directly before this; `saveChangesForModel.test.ts` tests a different
concern (hooks must not fire during sync's `bulkCreate({ hooks: false })`); facility-server's
`EncounterInvoice.test.js` has integration-level coverage of the same business behaviour
via HTTP routes, but doesn't exercise the restore-from-soft-delete or concurrent-call
paths.

## Verification

All 4 targeted suites pass (12 tests), full `__tests__/sync` + invoice-related suites
pass (29 suites, 193 tests), lint clean. Facility-server's own suite couldn't be run in
this environment (pre-existing, unrelated local config conflict — `test.json5` sets
`serverFacilityIds` while `local.json5` sets `serverFacilityId`); `FacilitySyncManager.js`
calls the identical `withDeferredSyncSafeguards` helper validated above, but worth
running facility-server's suite in CI before merging.

## Follow-ups not covered by this ticket

- Convert the 6 partial/expression unique indexes via `btree_gist` `EXCLUDE` constraints
  — separate ticket. There's stale, uncommitted prior art for the
  `patient_invoice_insurance_plans` case specifically (a local-only build artifact,
  `packages/database/dist/esm/migrations/1781055691886-makePatientInvoiceInsurancePlanUniqueConstraintDeferrable.js`,
  never committed to any branch) — worth a look as a starting point, but unverified.
- `patient_facilities_patient_id_facility_id_key` could be revisited if
  `onCreateEncounterMarkPatientForSync.ts` needs rewriting for other reasons anyway.
