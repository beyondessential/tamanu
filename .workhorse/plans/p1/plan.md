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

### Pass 1 also clears the flag
A row can be both flagged (from an earlier disabled-mode write) and selected by pass 1 (if a later
clock-advancing write moved its tick past `:since`). To stop pass 2 redundantly reworking such rows,
pass 1's upsert also sets `needs_rebuild = false`. Rows flagged with an unchanged tick are never
selected by pass 1 (`updated_at_sync_tick > :since`) and remain for pass 2.

### Flagging folds into `set_updated_at_sync_tick` (Option B)
Rather than a separate always-firing trigger (which would add a `sync_lookup` write on every hot-path
write and contend with the 20s rebuild), the flag is set by `set_updated_at_sync_tick` itself:

- **Clock-advancing write** → stamp the tick as today, no lookup write. Caught by the incremental
  build. This keeps the hot path free of lookup contention.
- **Disabled mode** → instead of `RETURN NEW`, mark the lookup row `needs_rebuild` (stub if absent).
  This is the only path that writes to `sync_lookup`.

Only writes that *don't* advance the clock need flagging, because clock-advancing writes are already
covered by pass 1 — so this scoping is exactly right, not just a contention optimisation.

### Migrations disable the trigger instead of dropping it
`runPreMigration` currently drops `set_updated_at_sync_tick`. Change it to leave the trigger in place
and put it into disabled mode (set the `syncTrigger` fact to `disabled`); `runPostMigration` restores
it to enabled. In disabled mode the trigger flags without bumping ticks, so migration DML gets no tick
churn (the original reason for the drop) **and** migration drift is flagged precisely. The gate then
stays a cheap flag-drain — no full rebuild.

### Two axes decided at install via a trigger argument
The flag branch must run only for lookup-tracked tables (pull/bidirectional) and only on central.
Both are decided when the trigger is installed, in Node, which has model sync direction and server
type in context. Pass a boolean to the function per table: `CREATE TRIGGER … EXECUTE FUNCTION
set_updated_at_sync_tick('true')` for lookup-tracked tables on central, `'false'` (or no arg)
elsewhere. The function reads `TG_ARGV[0]` in the flag branch — in-memory, no fact lookup, single
function, no per-table variants.
**Verify:** whether `sequelize.models` (model sync directions) is available where the trigger is
installed (`runPostMigration` uses config + raw SQL today). If not, thread the pull/bidirectional
table list in. The arg is baked at install and not refreshed (the trigger is no longer dropped each
migration); direction is static so that's fine, and server type only goes stale on a restore onto the
opposite server type — an edge case. Optionally, `runPostMigration` can recreate the trigger when the
desired arg differs from what is installed.

### Hard deletes need their own trigger
`set_updated_at_sync_tick` is `BEFORE INSERT OR UPDATE`, so it never sees a hard `DELETE` and a
hard-deleted source would orphan its lookup row. Add a separate `AFTER DELETE` trigger on
lookup-tracked tables that **directly deletes** the matching `sync_lookup` row (not flag-and-defer —
deferring leaves a window where a snapshot could ship a phantom record). It fires on every hard delete
(deletes never advance a tick and the build never removes rows) and must remain active during
migrations. Soft deletes are ordinary `UPDATE`s and need no special handling. Pass 2 keeps a
source-gone delete as a cheap backstop.

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

### Trigger — flagging (folded into `set_updated_at_sync_tick`)
- [ ] Extend `set_updated_at_sync_tick()` (`000_baseline.sql`) so its disabled branch, instead of
  `RETURN NEW`, flags the record when `TG_ARGV[0]` is true: upsert `sync_lookup` for
  `(NEW.id, TG_TABLE_NAME)` setting `needs_rebuild = true`; if no row exists, insert a stub
  (`data = NULL`, `needs_rebuild = true`, `is_deleted = NEW.deleted_at IS NOT NULL`, remaining columns
  defaults/NULL — never read until healed). When `TG_ARGV[0]` is false/absent, keep the current
  `RETURN NEW`. The enabled (clock-advancing) branch is unchanged — no lookup write.
- [ ] Model the upsert SQL on `flag_lookup_model_to_rebuild` in `000_baseline.sql`.
- [ ] Update trigger installation to pass the boolean per table: `'true'` for lookup-tracked
  (pull/bidirectional) tables on central, `'false'`/absent otherwise. This needs model sync directions
  at install time — see the "Two axes" design note (verify `sequelize.models` availability in
  `runPostMigration`; thread the table list in if not).
- [ ] `runPostMigration` ensures the sync tick trigger exists on every syncing table with the correct
  `lookup-tracked` arg, including tables added by a later migration.

### Trigger — hard deletes
- [ ] Create an `AFTER DELETE` trigger function on lookup-tracked tables that directly deletes the
  matching lookup row: `DELETE FROM sync_lookup WHERE record_type = TG_TABLE_NAME AND record_id =
  OLD.id`. It fires unconditionally (not gated on disabled mode).
- [ ] Install it on pull/bidirectional tables on central (same direction/server scoping as the flag),
  and ensure `runPostMigration` adds it to new lookup-tracked tables.
- [ ] Do **not** add this trigger to `runPreMigration`'s drop loop — it must stay active through
  migrations to catch bulk hard deletes.

### Migration hooks
- [ ] Change `runPreMigration` (`migrationHooks.ts`): stop dropping `set_updated_at_sync_tick`; instead
  set the `syncTrigger` fact to `disabled` so the trigger flags without bumping ticks during migration.
- [ ] `runPostMigration` restores `syncTrigger` to enabled. Confirm nothing else relied on the trigger
  being physically absent during migrations (e.g. a migration setting `updated_at_sync_tick` by hand —
  the disabled branch passes `NEW` through untouched, matching the old dropped behaviour).

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
See `.workhorse/test-cases/p1/overview.md` for the concrete scenarios. Key ones:
- A write in disabled mode flags the row (and stubs if absent); a clock-advancing write does **not**
  touch the lookup table.
- A migration (trigger in disabled mode) that mutates data with no tick bump is flagged and healed —
  data corrected, tick unchanged — and the gate drains all flags.
- A stub is excluded from snapshots pre-build, then healed with the source tick and appears.
- A hard delete removes the lookup row directly, including hard deletes performed during a migration.
- A soft delete keeps `is_deleted = true`.
- A healed row is byte-identical to a normally-built one.
- The flag branch runs only for lookup-tracked tables on central: no flagging for push-only tables,
  and none on facility (`TG_ARGV[0]` false).
- The gate leaves zero flagged rows and blocks the upgrade on any remaining.
