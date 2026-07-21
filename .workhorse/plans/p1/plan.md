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
**Resolved:** `sequelize.models` (model sync directions) is available where the trigger is installed —
`runPostMigration` receives the same `sequelize` instance used elsewhere in `migrations.js`, which
already reads `sequelize.models.LocalSystemFact` (see `syncDatabaseServerVersionForMigrateUp`), so no
table-list threading was needed. `runPostMigration` unconditionally drops and recreates the trigger
(`DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`, not `CREATE OR REPLACE TRIGGER`, to stay compatible
with Postgres 12) with the correct arg on every table, every migration batch — no need to compare
against what's already installed first, since the DDL itself is cheap and touches no data.

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
- [x] Add `needs_rebuild BOOLEAN NOT NULL DEFAULT false` to `sync_lookup` (DDL migration in
  `packages/database/src/migrations/`, created via `npm run create-migration`). Default `false` means
  no backfill — existing rows start unflagged, per the spec.
- [x] Relax `sync_lookup.data` to nullable (`ALTER COLUMN data DROP NOT NULL`) so stub rows can carry
  `data = NULL`.
- [x] Add a partial index for the self-heal scan: `CREATE INDEX sync_lookup_needs_rebuild_index ON
  sync_lookup (record_type) WHERE needs_rebuild` (indexing `record_type` under the partial predicate
  keeps the per-model pass-2 scan cheap).
- [x] Update `SyncLookup.ts`: add `declare needsRebuild?: boolean;` and the `needsRebuild` attribute
  (`DataTypes.BOOLEAN`, default `false`); `data` is already `DataTypes.JSON` (nullable in the model).
- [x] This migration is pure DDL — keep it free of DML so it doesn't trip the pending-trigger rule
  (`packages/database/CLAUDE.md`).

### Trigger — flagging (folded into `set_updated_at_sync_tick`)
- [x] Extend `set_updated_at_sync_tick()` so its disabled branch, instead of `RETURN NEW`, flags the
  record when `TG_ARGV[0]` is true: upsert `sync_lookup` for `(NEW.id, TG_TABLE_NAME)` setting
  `needs_rebuild = true`; if no row exists, insert a stub (`data = NULL`, `needs_rebuild = true`,
  `is_deleted = NEW.deleted_at IS NOT NULL`, remaining columns defaults/NULL — never read until healed).
  When `TG_ARGV[0]` is false/absent, keep the current `RETURN NEW`. The enabled (clock-advancing) branch
  is unchanged — no lookup write. Implemented as a regular migration
  (`1784602019354-flagSyncLookupForRebuildOnDisabledTrigger.ts`) that does `CREATE OR REPLACE FUNCTION`,
  not a hand-edit of `000_baseline.sql` (the baseline is a generated squash; new behaviour belongs in an
  incremental migration).
- [x] The upsert SQL (modeled on `flag_lookup_model_to_rebuild`) is factored into its own standalone
  function, `flag_for_rebuild_in_sync_lookup(p_record_type text, p_record_id text)`, called via
  `PERFORM` from the trigger's disabled branch rather than inlined — same migration. Parameters are
  prefixed (`p_...`) because plpgsql raises "column reference is ambiguous" when a parameter name
  matches a column of a table targeted by `ON CONFLICT` in the function body.
- [x] Update trigger installation to pass the boolean per table: `'true'` for lookup-tracked
  (pull/bidirectional) tables on central, `'false'`/absent otherwise. **Resolved:** `sequelize.models`
  (with `syncDirection`) is available in `runPostMigration` — it receives the same `sequelize` instance
  used elsewhere in `migrations.js` (e.g. `syncDatabaseServerVersionForMigrateUp` already reads
  `sequelize.models.LocalSystemFact`), so no table-list threading was needed.
- [x] `runPostMigration` ensures the sync tick trigger exists on every syncing table with the correct
  `lookup-tracked` arg (`addOrReplaceUpdatedAtSyncTickTrigger` in `postMigrationHooks.ts`), including
  tables added by a later migration — via `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` (not
  `CREATE OR REPLACE TRIGGER`, to stay compatible with Postgres 12), run unconditionally over
  `allTables` (all public/logs tables, filtered by the usual excludes) every migration batch. No
  "what's already installed" comparison needed, since the DDL is cheap and touches no data.

### Trigger — hard deletes
- [x] Create an `AFTER DELETE` trigger function (`remove_from_sync_lookup_on_hard_delete`, migration
  `1784602090407-addSyncLookupHardDeleteTrigger.ts`) on lookup-tracked tables that directly deletes the
  matching lookup row. It fires unconditionally (not gated on disabled mode).
- [x] Install it on pull/bidirectional tables on central (same direction/server scoping as the flag) via
  `addSyncLookupDeleteTrigger` in `postMigrationHooks.ts`; ensures new lookup-tracked tables get it too.
- [x] Not added to `runPreMigration`'s drop loop — it's a separate trigger name, untouched by the
  (now disable-not-drop) sync-tick trigger handling, so it stays active through migrations.

### Migration hooks
- [x] `runPreMigration` (`preMigrationHooks.ts`) no longer drops `set_updated_at_sync_tick`; it sets the
  `syncTrigger` fact to `disabled` (guarded by a new `requireTable('local_system_facts')` prerequisite,
  since a truly fresh DB doesn't have that table before baseline runs).
- [x] `runPostMigration` restores `syncTrigger` to `enabled`. **Resolved:** nothing relied on the trigger
  being physically absent — the disabled branch passes `NEW` through untouched (unchanged from before),
  so a migration that sets `updated_at_sync_tick` by hand still works the same way. Verified via the
  existing `migrations.test.ts` suite (disabled-mode tick-churn tests) passing unchanged.

### Two-pass build
- [x] Pass 1: `updateLookupTableForModel` (`updateLookupTable.js`) now inserts `needs_rebuild = false`
  and sets `needs_rebuild = false` in the `ON CONFLICT DO UPDATE SET`.
- [x] Pass 2: `healFlaggedLookupRows`/`healFlaggedLookupRowsForModel` (new, `updateLookupTable.js`),
  called from `CentralSyncManager.updateLookupTable` in the same transaction, after pass 1. Per pull
  model:
  - [x] Rebuilds flagged rows from source, scoped to `record_id IN (flagged ids for this record_type)`,
    reusing pass 1's exact upsert query (factored into `buildLookupUpsertQuery`, shared by both passes
    so a healed row is byte-identical to a normally-built one) with `updatedAtSyncTick: null` — this
    makes `buildSyncLookupSelect`'s tick clause collapse to the source/historic tick in every case
    (both the full-rebuild CASE branches and the plain `COALESCE` form), without needing any change to
    `buildSyncLookupSelect.ts` itself.
  - [x] Deletes flagged rows whose source record no longer exists (backstop for the delete trigger).
  - [x] Soft-deleted source rows rebuild normally (`is_deleted = true`) — no special-casing needed.
- [x] The `-2` sweep (`updateSyncLookupPendingRecords`) is untouched; pass 2 writes real ticks so it
  cannot rewrite them (verified in a dedicated central-server test).

### Snapshot exclusion
- [x] `snapshotOutgoingChangesFromSyncLookup` (`snapshotOutgoingChanges.js`) now has `AND data IS NOT
  NULL` in its WHERE clause. `snapshotChangesForModel` (direct-from-model path) is unaffected.

### Migration gate
- [x] After `upgrade()` completes on central (and only when not `--dry-run`), `upgrade.js` constructs a
  `CentralSyncManager`, calls `updateLookupTable()`, then checks `SELECT count(*) FROM sync_lookup WHERE
  needs_rebuild` — throws (non-zero exit via the existing catch/`process.exit(1)`) if any remain.
  - [x] Lives in the central-server subcommand, not `@tamanu/upgrade`, per the import-boundary
    constraint.
  - [x] Guarded by `if (!dryRun)` — dry runs already rolled back inside `upgrade()`'s own transaction, so
    the gate is skipped rather than running for real outside it.

### dbt + docs
- [ ] Regenerate `database/model/` for `sync_lookup` (`npm run dbt-generate-model`), fill the new
  column's TODO doc, run `npm run dbt-check-todos`. Commit alongside the migration. **In progress** —
  regeneration run once already (confirmed the new `needs_rebuild` column and the new
  `delete_<table>_from_sync_lookup` triggers on ~100 lookup-tracked tables' `.yml` files); still need to
  investigate why `patients.yml` didn't pick up its new delete trigger in that run, fill in the new
  column's doc TODO, and run `dbt-check-todos`.

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
