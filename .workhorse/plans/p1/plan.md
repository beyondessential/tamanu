# Plan — sync_lookup self-healing

Implements `specs/sync/lookup-table.md` (id `LOOKUP`). Central-server only; `sync_lookup`, its
triggers, the two-pass build and the migration gate are all central concerns. No mobile (TypeORM)
migration is needed — this is central-only infrastructure, so the "mobile migration alongside server
migration" rule does not apply here. Call this out in the PR so it reads as deliberate.

## Design notes

### Two-pass build and the existing `-2` staging
The incremental build (pass 1) stays as-is: `updateLookupTableForModel` writes rows at
`LOOKUP_PENDING_UPDATE` (`-2`), and `updateSyncLookupPendingRecords` sweeps them to a settled tick in
`afterCommit` (`CentralSyncManager.updateLookupTable`, `snapshotOutgoingChanges` reads them). The
self-heal (pass 2) must **not** route through this staging: it writes each row's real sync tick taken
from the source record, so the `-2` sweep (which only touches `updated_at_sync_tick = -2`) never
rewrites a healed row's tick. Pass 2 runs inside the same `repeatableReadTransaction` as pass 1, after
the `updateLookupTable(...)` call, so the whole build is atomic.

### Why the tick comes from source
Pass 2 sets `updated_at_sync_tick` to the source record's current tick — the existing full-rebuild
"historicalRecordSyncTick" behaviour (`buildSyncLookupSelect.ts`). For drift on an existing row the
source tick has not moved, so the lookup tick is effectively preserved and facilities do not re-pull.
For a stub (new record that arrived via a migration) the source tick propagates it on the same terms
the source would. One rule covers both.

### Pass 1 must clear the flag
The trigger sets `needs_rebuild = true` on *every* source write, so during normal uptime it flags
rows the incremental pass already handles. Pass 1's upsert therefore also sets `needs_rebuild = false`
for the rows it writes. Because pass 1 only selects `updated_at_sync_tick > :since`, drift rows (tick
unchanged) are never selected and stay flagged for pass 2 — no redundant rebuilds.

### Trigger scope needs model knowledge
Only pull/bidirectional tables feed `sync_lookup`. Installing the trigger on a push-only table would
create stub rows that pass 2 (which iterates `getModelsForPull`) never clears, so the gate would never
pass. The trigger set must therefore be derived from model sync directions
(`getModelsForDirection` / `getModelsForPull`), not from a raw information_schema sweep.
**Verify:** whether `sequelize.models` is populated inside `runPostMigration` (it only uses config +
raw SQL today). If yes, derive the qualifying table list there; if not, install/ensure triggers from a
place that has models (the central upgrade path below) and keep `runPostMigration` model-free.

## Build steps

### Schema
- [ ] Add `needs_rebuild BOOLEAN NOT NULL DEFAULT false` to `sync_lookup` (DDL migration in
  `packages/database/src/migrations/`, created via `npm run create-migration`). Default `false` means
  no backfill — existing rows start unflagged, per the spec.
- [ ] Relax `sync_lookup.data` to nullable (`ALTER COLUMN data DROP NOT NULL`) so stub rows can carry
  `data = NULL`.
- [ ] Add a partial index for the self-heal scan: `CREATE INDEX sync_lookup_needs_rebuild_index ON
  sync_lookup (record_type) WHERE needs_rebuild` (indexing `record_type` under the partial predicate
  keeps the per-model pass-2 scan cheap).
- [ ] Update `SyncLookup.ts`: add `declare needsRebuild?: boolean;` and the `needsRebuild` attribute
  (`DataTypes.BOOLEAN`, default `false`); `data` is already `DataTypes.JSON` (nullable in the model).
- [ ] This migration is pure DDL — keep it free of DML so it doesn't trip the pending-trigger rule
  (`packages/database/CLAUDE.md`).

### Trigger
- [ ] Create the trigger function (SQL migration), e.g. `set_sync_lookup_needs_rebuild()`, as an
  `AFTER INSERT OR UPDATE` trigger. It upserts `sync_lookup` for `(NEW.id, TG_TABLE_NAME)`: set
  `needs_rebuild = true`; if no row exists, insert a stub (`data = NULL`, `needs_rebuild = true`,
  `is_deleted = NEW.deleted_at IS NOT NULL`, remaining columns left to defaults/NULL — never read
  until healed). Model the SQL on `set_updated_at_sync_tick` / `flag_lookup_model_to_rebuild` in
  `000_baseline.sql`.
- [ ] Unlike `set_updated_at_sync_tick`, the function does **not** short-circuit on
  `local_system_facts.syncTrigger = 'disabled'` — it always fires, so bulk-import and migration writes
  are captured.
- [ ] Install the trigger on every existing pull/bidirectional table (central only) in the migration.
- [ ] Ensure new qualifying tables are covered automatically: add a central-gated block that installs
  the trigger on any pull/bidirectional table missing it (mirroring how `runPostMigration` in
  `migrationHooks.ts` maintains `set_updated_at_sync_tick`), deriving the table set from models — see
  the "Trigger scope" design note for where this lives.
- [ ] Do **not** add this trigger to `runPreMigration`'s drop loop — it must survive migrations.

### Two-pass build
- [ ] Pass 1: in `updateLookupTableForModel` (`updateLookupTable.js`), add `needs_rebuild` to the
  INSERT (value `false`) and `needs_rebuild = false` to the `ON CONFLICT DO UPDATE SET`.
- [ ] Pass 2: add a self-heal step (new function in `updateLookupTable.js`, called from
  `CentralSyncManager.updateLookupTable` inside the same transaction, after pass 1). Per pull model:
  - [ ] Rebuild flagged rows from source, scoped to `record_id IN (flagged record_ids for this
    record_type)`, using the source record's tick (reuse `buildSyncLookupSelect` in a source-tick
    mode — pass parameters so `updatedAtSyncTickClause` yields the base table's tick), and set
    `needs_rebuild = false`.
  - [ ] Delete flagged rows whose source record no longer exists:
    `DELETE FROM sync_lookup sl WHERE sl.record_type = :table AND sl.needs_rebuild AND NOT EXISTS
    (SELECT 1 FROM :table t WHERE t.id = sl.record_id)`.
  - [ ] Soft-deleted source rows rebuild normally (`is_deleted = true`), no special-casing.
- [ ] Confirm the `-2` sweep (`updateSyncLookupPendingRecords`) is untouched and cannot rewrite
  pass-2 ticks (it filters on `= -2`; pass 2 writes real ticks).

### Snapshot exclusion
- [ ] In `snapshotOutgoingChangesFromSyncLookup` (`snapshotOutgoingChanges.js`), add `AND data IS NOT
  NULL` to the WHERE clause so stub rows are never sent to a facility. The direct-from-model path
  (`snapshotChangesForModel`) is unaffected.

### Migration gate
- [ ] After migrations complete on central, run the two-pass build and assert no flagged rows remain,
  blocking the upgrade otherwise. Home it in the central-server upgrade subcommand
  (`packages/central-server/app/subCommands/upgrade.js`, and check `migrate.js`) after `await
  upgrade(...)`: construct/reach `CentralSyncManager`, call `updateLookupTable()`, then
  `SELECT count(*) FROM sync_lookup WHERE needs_rebuild` — throw (non-zero exit) if any remain.
  - [ ] Reason for placement: the rebuild logic lives in `@tamanu/central-server`, which the shared
    `@tamanu/upgrade` package must not import. The central subcommand already owns `CentralSyncManager`.
  - [ ] Dry-run (`--dry-run`) runs `upgrade()` in a rollback transaction; skip or guard the gate for
    dry runs so it doesn't execute outside that transaction.

### dbt + docs
- [ ] Regenerate `database/model/` for `sync_lookup` (`npm run dbt-generate-model`), fill the new
  column's TODO doc, run `npm run dbt-check-todos`. Commit alongside the migration.

## Testing notes
See `.workhorse/test-cases/p1/overview.md` for the concrete scenarios. Key ones: a migration-style
mutation with no tick bump is healed (data corrected, tick unchanged); a stub is excluded from
snapshots pre-build then healed with the source tick; a hard-deleted source prunes its lookup row; a
soft-deleted source keeps `is_deleted = true`; a healed row is byte-identical to a normally-built one;
the trigger fires under `syncTrigger = 'disabled'`; the gate leaves zero flagged rows and blocks on
any remaining.
