# Sync lookup self-healing — test cases

Scenarios that verify the sync lookup self-healing behaviour (spec: LOOKUP). They run mainly as
**central-server integration tests** against a real DB (`packages/central-server/__tests__/sync/` —
`CentralSyncManager.updateLookupTable`, `updateLookupTable.js`, `snapshotOutgoingChanges.js`) and
**migration-hook tests** (`packages/database/__tests__/services/migrations/`). Toggling
`local_system_facts.syncTrigger` between `enabled`/`disabled` simulates the two write modes. Scenarios
cite the criterion they exercise; uncited ones are operational.

## Flagging (sync tick trigger, disabled mode)

- [x] Write (insert/update) to a lookup-tracked table with `syncTrigger` enabled and confirm the sync tick is bumped and no `needs_rebuild` change / no extra `sync_lookup` write occurs. verifies spec: LOOKUP#flagging-records-for-rebuild — `packages/database/__tests__/sync/syncLookupSelfHeal.test.ts`
- [x] Update a record on a lookup-tracked table with `syncTrigger` disabled and confirm its existing lookup row is marked `needs_rebuild = true` and its `updated_at_sync_tick` is unchanged. verifies spec: LOOKUP#flagging-records-for-rebuild — same file
- [x] Insert a record on a lookup-tracked table with `syncTrigger` disabled and no existing lookup row, and confirm a stub row is created with `data = NULL` and `needs_rebuild = true`. verifies spec: LOOKUP#flagging-records-for-rebuild — same file
- [x] Write to a push-only table with `syncTrigger` disabled and confirm no `sync_lookup` row is created or flagged (`TG_ARGV[0]` false). verifies spec: LOOKUP#flagging-records-for-rebuild — same file
- [x] On a facility server (trigger installed with the lookup-tracked arg false), write with `syncTrigger` disabled and confirm no flagging or stubbing occurs. verifies spec: LOOKUP#flagging-records-for-rebuild — same file (`trigger install axes` describe block)
- [x] Confirm the flag path never populates `data` — a stub's `data` stays null until a build heals it. verifies spec: LOOKUP#flagging-records-for-rebuild — same file

## Hard deletes

- [x] Hard-delete a record on a lookup-tracked table and confirm its `sync_lookup` row is flagged `needs_rebuild = true` (not deleted immediately — removal happens via the next build's self-heal pass, so it lands atomically with any other row's rebuild that depended on the deleted record). verifies spec: LOOKUP#flagging-records-for-rebuild — `packages/database/__tests__/sync/syncLookupSelfHeal.test.ts`
- [x] Hard-delete records on a lookup-tracked table during a migration (trigger in disabled mode) and confirm their lookup rows are flagged. verifies spec: LOOKUP#flagging-records-for-rebuild — same file
- [x] Hard-delete a record concurrently with an in-progress build that would otherwise rebuild that same record, and confirm the build aborts (serialization failure) rather than resurrecting stale pre-deletion data. verifies spec: LOOKUP#populating-the-lookup-table — `packages/central-server/__tests__/sync/CentralSyncManager.updateLookupTable.test.js` ("concurrent hard delete during an in-progress build")
- [ ] Soft-delete a record (set `deleted_at` via a normal update) and confirm the lookup row is rebuilt with `is_deleted = true` and is retained, not deleted. verifies spec: LOOKUP#rebuilding-flagged-records — not yet covered by a dedicated test (soft deletes are ordinary updates, so this is exercised implicitly by the untouched pre-existing `CentralSyncManager.updateLookupTable` suite, but no test asserts `is_deleted = true` post-soft-delete specifically for this feature)
- [ ] Hard-delete on a facility server and confirm no error and no lookup interaction (no delete trigger there). operational — not covered; would need a facility-server-configured test DB

## Snapshot exclusion of stubs

- [x] Build an outgoing snapshot while a stub row (`data = NULL`) exists and confirm the stub is not included. verifies spec: LOOKUP#flagging-records-for-rebuild — `packages/central-server/__tests__/sync/snapshotOutgoingChanges.syncLookup.test.js`
- [x] Heal the stub (run the build), then build a snapshot for a new facility and confirm the record now appears. verifies spec: LOOKUP#rebuilding-flagged-records — same file

## Two-pass healing

- [x] Mutate a record's data in disabled mode with no tick bump, run `updateLookupTable`, and confirm the lookup row's `data` matches source and its `updated_at_sync_tick` is unchanged. verifies spec: LOOKUP#rebuilding-flagged-records — `packages/central-server/__tests__/sync/CentralSyncManager.updateLookupTable.test.js` (`self-heal (needs_rebuild)`)
- [x] Confirm a healed row is byte-identical to the same record built by the normal incremental path. verifies spec: LOOKUP#rebuilding-flagged-records — same file
- [x] Insert a new record in disabled mode (stub created), run the build, and confirm it is healed with the sync tick taken from the source record. verifies spec: LOOKUP#rebuilding-flagged-records — same file
- [x] Flag a row (disabled write), then update it normally so its tick advances past the build cursor; run the build and confirm pass 1 rebuilds and clears the flag and pass 2 does not rework it. verifies spec: LOOKUP#rebuilding-flagged-records — same file
- [ ] Confirm a healed row's tick is not rewritten by the `-2` pending sweep after commit (pass 2 writes a real source tick, not `-2`). verifies spec: LOOKUP#rebuilding-flagged-records — not covered by a dedicated test; follows by construction (pass 2 never writes `-2`, and the sweep only matches `= -2`), but not independently verified
- [x] Flag a row whose source no longer exists (its own hard delete already flagged it, or via any other means), run the build, and confirm pass 2 deletes the orphaned lookup row — this is the only path that removes a hard-deleted record's lookup row, since the delete trigger only flags it. verifies spec: LOOKUP#rebuilding-flagged-records — same file
- [x] Confirm a partial index on `needs_rebuild` exists so the self-heal scan does not sequentially scan `sync_lookup`. operational — `packages/database/__tests__/sync/syncLookupSelfHeal.test.ts`

## Migration hooks (disable, not drop)

- [ ] During a migration, confirm `set_updated_at_sync_tick` remains installed (not dropped) and `local_system_facts.syncTrigger` is `disabled`. verifies spec: LOOKUP#flagging-records-for-rebuild — not independently asserted (implied by the disable-not-drop implementation and the passing pre-existing `migrations.test.ts` suite)
- [x] Run a migration that writes data and confirm no sync ticks are churned (source `updated_at_sync_tick` values unchanged). verifies spec: LOOKUP#flagging-records-for-rebuild — pre-existing `packages/database/__tests__/sync/migrations.test.ts`, unchanged and still passing
- [ ] Confirm a migration that sets `updated_at_sync_tick` by hand has its value passed through untouched (disabled branch matches the old dropped behaviour). operational — not covered by a dedicated test
- [x] After migration, confirm `syncTrigger` is restored to enabled and normal writes bump ticks again. operational — `packages/database/__tests__/sync/syncLookupSelfHeal.test.ts` (every test relies on this via its `beforeEach`/`enableSyncTrigger` round-trips)

## Migration gate

- [ ] Run migrations that mutate data without bumping ticks and confirm the end-of-migration rebuild leaves zero rows with `needs_rebuild = true`. verifies spec: LOOKUP#blocking-upgrades-until-the-lookup-table-is-consistent — not covered; the gate logic in `upgrade.js` has no automated test
- [ ] Leave a row flagged after the rebuild (forced) and confirm the gate blocks the upgrade (throws / non-zero exit). verifies spec: LOOKUP#blocking-upgrades-until-the-lookup-table-is-consistent — not covered
- [ ] Run the upgrade with `--dry-run` and confirm the gate does not execute outside the rollback transaction. operational — not covered

## Schema & regression

- [ ] Apply the migration and confirm existing `sync_lookup` rows have `needs_rebuild = false` (no backfill). operational — not independently asserted (implied by the DDL default; no pre-existing rows in the test DB to exercise backfill absence against)
- [x] Confirm `sync_lookup.data` accepts null after the migration. operational — proven by the stub-row tests successfully inserting `data = NULL`
- [x] Confirm the normal incremental build and existing sync flows are unchanged for clock-advancing writes (no regression from the folded trigger). operational — full pre-existing `CentralSyncManager.updateLookupTable.test.js` and `snapshotOutgoingChanges.syncLookup.test.js` suites pass unmodified
