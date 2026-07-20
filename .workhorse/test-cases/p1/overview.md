# Sync lookup self-healing — test cases

Scenarios that verify the sync lookup self-healing behaviour (spec: LOOKUP). They run mainly as
**central-server integration tests** against a real DB (`packages/central-server/__tests__/sync/` —
`CentralSyncManager.updateLookupTable`, `updateLookupTable.js`, `snapshotOutgoingChanges.js`) and
**migration-hook tests** (`packages/database/__tests__/services/migrations/`). Toggling
`local_system_facts.syncTrigger` between `enabled`/`disabled` simulates the two write modes. Scenarios
cite the criterion they exercise; uncited ones are operational.

## Flagging (sync tick trigger, disabled mode)

- [ ] Write (insert/update) to a lookup-tracked table with `syncTrigger` enabled and confirm the sync tick is bumped and no `needs_rebuild` change / no extra `sync_lookup` write occurs. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Update a record on a lookup-tracked table with `syncTrigger` disabled and confirm its existing lookup row is marked `needs_rebuild = true` and its `updated_at_sync_tick` is unchanged. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Insert a record on a lookup-tracked table with `syncTrigger` disabled and no existing lookup row, and confirm a stub row is created with `data = NULL` and `needs_rebuild = true`. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Write to a push-only table with `syncTrigger` disabled and confirm no `sync_lookup` row is created or flagged (`TG_ARGV[0]` false). verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] On a facility server (trigger installed with the lookup-tracked arg false), write with `syncTrigger` disabled and confirm no flagging or stubbing occurs. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Confirm the flag path never populates `data` — a stub's `data` stays null until a build heals it. verifies spec: LOOKUP#flagging-records-for-rebuild

## Hard deletes

- [ ] Hard-delete a record on a lookup-tracked table and confirm its `sync_lookup` row is deleted immediately. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Hard-delete records on a lookup-tracked table during a migration (trigger in disabled mode) and confirm their lookup rows are removed. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Soft-delete a record (set `deleted_at` via a normal update) and confirm the lookup row is rebuilt with `is_deleted = true` and is retained, not deleted. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Hard-delete on a facility server and confirm no error and no lookup interaction (no delete trigger there). operational

## Snapshot exclusion of stubs

- [ ] Build an outgoing snapshot while a stub row (`data = NULL`) exists and confirm the stub is not included. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Heal the stub (run the build), then build a snapshot for a new facility and confirm the record now appears. verifies spec: LOOKUP#rebuilding-flagged-records

## Two-pass healing

- [ ] Mutate a record's data in disabled mode with no tick bump, run `updateLookupTable`, and confirm the lookup row's `data` matches source and its `updated_at_sync_tick` is unchanged. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Confirm a healed row is byte-identical to the same record built by the normal incremental path. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Insert a new record in disabled mode (stub created), run the build, and confirm it is healed with the sync tick taken from the source record. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Flag a row (disabled write), then update it normally so its tick advances past the build cursor; run the build and confirm pass 1 rebuilds and clears the flag and pass 2 does not rework it. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Confirm a healed row's tick is not rewritten by the `-2` pending sweep after commit (pass 2 writes a real source tick, not `-2`). verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Flag a row then hard-delete its source before the build runs (bypassing the delete trigger in the test), run the build, and confirm the backstop deletes the orphaned lookup row. verifies spec: LOOKUP#rebuilding-flagged-records
- [ ] Confirm a partial index on `needs_rebuild` exists so the self-heal scan does not sequentially scan `sync_lookup`. operational

## Migration hooks (disable, not drop)

- [ ] During a migration, confirm `set_updated_at_sync_tick` remains installed (not dropped) and `local_system_facts.syncTrigger` is `disabled`. verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Run a migration that writes data and confirm no sync ticks are churned (source `updated_at_sync_tick` values unchanged). verifies spec: LOOKUP#flagging-records-for-rebuild
- [ ] Confirm a migration that sets `updated_at_sync_tick` by hand has its value passed through untouched (disabled branch matches the old dropped behaviour). operational
- [ ] After migration, confirm `syncTrigger` is restored to enabled and normal writes bump ticks again. operational

## Migration gate

- [ ] Run migrations that mutate data without bumping ticks and confirm the end-of-migration rebuild leaves zero rows with `needs_rebuild = true`. verifies spec: LOOKUP#blocking-upgrades-until-the-lookup-table-is-consistent
- [ ] Leave a row flagged after the rebuild (forced) and confirm the gate blocks the upgrade (throws / non-zero exit). verifies spec: LOOKUP#blocking-upgrades-until-the-lookup-table-is-consistent
- [ ] Run the upgrade with `--dry-run` and confirm the gate does not execute outside the rollback transaction. operational

## Schema & regression

- [ ] Apply the migration and confirm existing `sync_lookup` rows have `needs_rebuild = false` (no backfill). operational
- [ ] Confirm `sync_lookup.data` accepts null after the migration. operational
- [ ] Confirm the normal incremental build and existing sync flows are unchanged for clock-advancing writes (no regression from the folded trigger). operational
