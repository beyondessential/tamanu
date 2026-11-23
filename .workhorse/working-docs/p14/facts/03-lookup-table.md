# Fact sheet 03: the sync lookup table
Ledger ids: LKP-n and Q-n are in `06-lookup-table-build.md`; PLL-n in `05-pull-snapshot.md`. T1 is the build transaction, T2 the after-commit stamping transaction. All code is under `packages/` unless a path is given. `CSM` is `central-server/app/sync/CentralSyncManager.js`, `ULT` is `central-server/app/sync/updateLookupTable.js`, `SOC` is `central-server/app/sync/snapshotOutgoingChanges.js`.
## 1. What it is and what it replaced
- `sync_lookup` is a central-only denormalised copy of every syncable record (`data` json, not jsonb), with scope columns (patient, facility, sensitive network, lab-request flag) and a lookup tick. A scheduled build refreshes it; pulls read only it [LKP-03, LKP-06, PLL-08]
- It replaced per-pull filtering: each model's `buildSyncFilter`/`buildPatientSyncFilter` ran at snapshot time per session (`snapshotChangesForModel` in SOC). That path still exists and runs when config `sync.lookupTable.enabled` is false (default true; the test config sets false) [LKP-02, LKP-04, PLL-39] Introduced by PR #6167 [LKP-02]
- Lag: a write on central is pullable only after the next build commits T2. Up to one refresher interval (default 20 s) plus the wait for in-flight edits plus build time [LKP-08]
- Not true: the client pull tick is not "the lookup's version of the database". `pullUntil` is the pull's own tick-tock; the lookup decides only which rows exist [LKP-11]

## 2. Schema
`sync_lookup` (model `database/src/models/SyncLookup.ts`) [Q11]:

| Column | Purpose |
|---|---|
| `id` bigint sequence | read paging cursor (`id > :fromId ORDER BY id`); copied to the snapshot as `sync_lookup_id` |
| `record_id` text, `record_type` (source table name) | identify the source record; unique together (ON CONFLICT target) |
| `data` json, nullable | record copy; null on stub rows, which pulls exclude |
| `updated_at_sync_tick` | lookup tick: `-2` pending, source tick on initial build / full rebuild / heal, T2 tick otherwise |
| `patient_id`, `facility_id`, `sensitive_network_id` | scope columns (`sensitive_network_id` added with sensitive networks) |
| `encounter_id` | never populated by any caller, always NULL (`inference` from absence) [Q6] |
| `is_lab_request`, `is_deleted` | lab-request flag; soft-delete tombstone |
| `updated_at_by_field_sum` | per-field tick sum for `removeEchoedChanges` |
| `pushed_by_device_id` | avoid-repull attribution |
| `needs_rebuild` bool default false | self-heal flag |

Indexes: PK `id`; unique `(record_id, record_type)`; `patient_id`; `(updated_at_sync_tick, record_id, patient_id, facility_id)`; partial `(record_type) WHERE needs_rebuild`; partial `(sensitive_network_id) WHERE sensitive_network_id IS NOT NULL`. `facility_id` alone is not indexed [Q11, LKP-07].

- `sync_lookup_ticks` (`SyncLookupTick.ts`): `source_start_tick`, `lookup_end_tick` (PK). One row per build; never pruned, about one per refresh [Q11]
- `sync_device_ticks`: `persisted_at_sync_tick` (PK), `device_id`; one row per persisted push, no pruning code found [Q11, Q7]
- None of the three has triggers or foreign keys; all are in `NON_SYNCING_TABLES` [LKP-45, LKP-13]
- Local system facts (`local_system_facts`, names in `constants/src/facts.ts`) [LKP-25, Q9]:
  - `lastSuccessfulLookupTableUpdate`: the build cursor (source tick built up to)
  - `currentSyncTick`: the central clock
  - `syncTrigger`: `'disabled'` during migrations, read by the triggers
  - `lookupModelsToRebuild`: comma list of tables to rebuild in full
  - `lookupPatientsToRebuild`: patient ids whose rows need rebuilding

## 3. The refresher
- Task `SyncLookupRefresher`; `run()` calls `centralSyncManager.updateLookupTable()`. Runs in the central tasks process, not the API process [LKP-05, Q1]
- Schedule setting `schedules.syncLookupRefresher.schedule`, default `*/20 * * * * *` (cron with seconds field), `enabled` true, `jitterTime` null. Read once at startup, so changes need a restart [Q1]
- Overlap in one process: prevented; `ScheduledTask` skips if `isRunning` [Q1]
- Overlap across processes: not prevented. No advisory lock. A second concurrent build would likely fail with SQLSTATE 40001 on the cursor fact (`inference`, untested) [Q1]
- Errors: logged, debug log updated, rethrown; `ScheduledTask` logs "Failed" and returns. No backoff; the next fire retries. T1 rolls back whole so the cursor does not advance [Q1]
- If T2's hook throws, T1 is already committed: cursor and `-2` rows persist, the next successful T2 retags them, and that run's `sync_lookup_ticks` row is missing (`inference`) [Q1]

## 4. A build, step by step
`updateLookupTable` in CSM (outer), `updateLookupTable` in ULT (inner) [Q2]:

1. Create a `DebugLog` row (autocommit) [Q2]
2. `tickTockGlobalClock` #1, autocommit, keep the "tick" half as `currentTick`; row lock released at once [Q2]
3. `waitForPendingEdits(currentTick)`: finds advisory share locks (held by in-flight writes via `set_updated_at_sync_tick`) with tick below `currentTick`, takes then releases an exclusive lock on each [Q2]
4. Read the cursor fact (`|| -1`), decide `isInitialBuildOfLookupTable`. Autocommit [Q2]
5. T1 via `repeatableReadTransaction`: isolation REPEATABLE READ, runs `SELECT 1` first to pin the snapshot [Q2, LKP-37]
   - Incremental: register the after-commit hook (T2). Initial: see section 6
   - Pass 1, incremental: per model from `getModelsForPull`, call `buildSyncLookupQueryDetails`, upsert rows with `updated_at_sync_tick = -2`
   - Pass 2, flagged-patient rebuild (section 10), capped by setting `sync.maxFlaggedPatientsPerBuild` (default 1000)
   - Pass 3, self-heal `healFlaggedLookupRows` (section 10)
   - Write the cursor fact `lastSuccessfulLookupTableUpdate = currentTick` inside T1. Reason (comment): so a failed build leaves the cursor behind and the next one still detects the records that failed
6. T1 commits. After-commit hooks run in registration order: T2, then the patient-flag cleanup (`markLookupPatientsRebuilt`, for exactly the ids rebuilt, so a patient flagged mid-build survives) [Q2, Q9]
7. T2: `store.sequelize.transaction`, no isolation option, so read committed. Steps: `tickTockGlobalClock` #2 (`lookupEndTick`), `updateSyncLookupPendingRecords` (`UPDATE sync_lookup SET updated_at_sync_tick = :lookupEndTick WHERE updated_at_sync_tick = -2`), create `SyncLookupTick { sourceStartTick: previous cursor, lookupEndTick }` [Q2, LKP-39]
- Tick-tock is an `UPDATE` of the `currentSyncTick` row (`LocalSystemFact.incrementValue`), run in T2 via CLS, so T2 holds that row lock until commit. Any tick-tock from a pull, session start, persist or second build waits for T2. Comment: "any writes to currentSyncTick will have to wait until this transaction is committed" [Q4]
- Batching: rows chunked by `sync.maxRecordsPerSnapshotChunk` (default effectively off), paged by record id; a chunk is not a commit boundary. Optional `perModelUpdateTimeoutMs` (default null) sets `SET LOCAL statement_timeout`; model timings are debug output only [LKP-13, LKP-20]
- Isolation summary: steps 1-4 read committed autocommit; T1 repeatable read; T2 read committed [Q2]

## 5. The pending flag
- Rows are written with `-2` (`SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE`) and retagged in T2 with a fresh tick. Nothing else writes `-2` [LKP-40]
- Why: rows must carry a tick later than any pull tick already handed out, but a long build cannot know its commit time. Stamping at write time could give a tick below a pull's `since` that snapshotted before commit, and the row would never be seen. Avoiding the flag would mean holding the clock lock for the whole build, blocking every pull. The flag shrinks the lock to T2. `inference` from the comment "avoiding sync sessions missing records while sync lookup is being refreshed" [LKP-42, Q3]
- What a pull sees: before T1 commits, nothing; between T1 and T2 commits, `-2` rows exist but `updated_at_sync_tick > :since` (since >= -1) excludes them; after T2, rows carry the new tick and any pull with `since` below it takes them. Retagging is not scoped to its own build, so a later T2 fixes an earlier failed one [Q3, LKP-41]
- Old constant `SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1` is still exported but stale. Reason for the -1 to -2 change (PR #7562) is unstated; `inference` that -1 collides with `INCOMING_FROM_CENTRAL_SERVER` and initial `since = -1` [LKP-40]

## 6. The initial build
- Initial means the cursor is absent, null or `-1` [Q5]
- Differences: passes `syncLookupTick = null`, so `COALESCE(:updatedAtSyncTick, table.updated_at_sync_tick)` uses source ticks; no T2 hook; `SyncLookupTick(-1, currentTick)` is written inside T1 [LKP-38]
- `prepareSession` refuses sessions with "Sync lookup table has not yet built. Cannot initiate sync." when lookup is enabled and the cursor fact is null. The client sees it as a session error when polling, not an HTTP failure [LKP-39b]
- Reason for source ticks: `inference`. No client can have pulled yet, and source ticks keep each record's real history so facilities already holding data do not re-pull it. The code comment only says it "uses ticks from the actual tables" [LKP-38]

## 7. Per-model population
- `static buildSyncLookupQueryDetails(sessionConfig)` returns null/undefined (syncs everywhere, e.g. `Patient`, `Facility`, `SensitiveNetwork`) or `{ select?, joins?, where?, filter? }`. The build passes `{}`, so builds never depend on a session [Q6]
  - `select`: built by `buildSyncLookupSelect(model, { patientId, facilityId, sensitiveNetworkId, encounterId, isLabRequestValue })` in `database/src/sync/buildSyncLookupSelect.ts`; omitted ids are NULL, lab flag FALSE
  - `joins`: appended after the tick and device joins
  - `where`: replaces `updated_at_sync_tick > :since`, incremental only; ignored for full rebuild, heal and patient pass
  - `filter`: ANDed onto every pass (so a row that stops matching keeps a stale lookup row, `inference`) [Q6]
- Scope columns [Q6]:
  - `patient_id`: model's own column (`buildPatientLinkedLookupFilter`), `encounters.patient_id` (`buildEncounterLinkedLookupSelect`), or a custom expression (`Note`, `Prescription`)
  - `facility_id`: only genuinely facility-bound records (patient facilities, settings, appointments, location assignments)
  - `sensitive_network_id`: `facilities.sensitive_network_id` reached encounter, location, facility via `buildEncounterLinkedLookupJoins` (47 models) and `Notification` via `metadata->>'encounterId'`; such rows have null `facility_id`. A test pins that every encounter-linked model carries it
  - `is_lab_request`: TRUE for lab request, test, panel request, log and attachment models; for encounters true only on the build that sees a newly changed lab request, reset by a later rebuild; notes never carry it
- Generic builders: `buildPatientLinkedLookupFilter`, `buildEncounterLinkedLookupFilter` (select and joins), in `database/src/sync/` [Q6]
- Upsert (`buildLookupUpsertQuery`, ON CONFLICT `(record_id, record_type)`) overwrites `data`, `updated_at_sync_tick` (kept if `preserveExistingTick`, heal only), `is_lab_request`, `patient_id`, `encounter_id`, `facility_id`, `sensitive_network_id`, `updated_at_by_field_sum`, `is_deleted`, `pushed_by_device_id`, and resets `needs_rebuild = false`. Not `id`, `record_id`, `record_type` [Q6]
- Nothing enforces a model having the method: `Model.validateSync` checks only the old filters. A pull model without it throws at build time, wrapped as "Failed to update X for lookup table", failing every build [LKP-04, Q-other]

## 8. Device attribution
- Config key `sync.lookupTable.avoidRepull` (config file, not settings; default true) [LKP-30]
- Set: with it on, the upsert source `LEFT JOIN sync_device_ticks ON persisted_at_sync_tick = <table>.updated_at_sync_tick`; `device_id` becomes `pushed_by_device_id`. Off, the join is a constant NULL [LKP-31]
- Why a match identifies the device: `persistIncomingChanges` stores `SyncDeviceTick { deviceId, persistedAtSyncTick: tock }`, and the persist transaction's writes are stamped with that tock; a second tick-tock then moves the clock on [LKP-32]
- Cleared: never separately. Recomputed on every upsert from the source row's current tick; a later central write (tick not in `sync_device_ticks`) makes it NULL; heal and patient passes recompute it too [Q7]
- Read: `AND (pushed_by_device_id <> :deviceId OR pushed_by_device_id IS NULL)`, only when `avoidRepull` and a `deviceId` are present. `removeEchoedChanges` still runs unconditionally but cannot match on the lookup path (lookup ticks are tick halves, persist ticks are tock halves) [LKP-33, PLL-34]
- Gap, `inference`, untested: a field-wise merge of `patient_additional_data` carries the persist tick and no `requires_repull`, so the pusher may miss other devices' newer field values [LKP-35]

## 9. Hard deletes
- The build query ends `FOR KEY SHARE OF <table>`. Comment: under REPEATABLE READ a row hard-deleted after the snapshot raises a serialisation failure instead of being resurrected from stale data; the build aborts and retries next cycle. KEY SHARE, not SHARE, so an ordinary concurrent UPDATE is not a conflict [Q8]
- Trigger `delete_<table>_from_sync_lookup` (AFTER DELETE, function `flag_sync_lookup_for_rebuild_on_hard_delete`) calls `flag_for_rebuild_in_sync_lookup`: sets `needs_rebuild`, or stubs a row. Central only, fires during migrations. It does not delete the lookup row. Reason (migration comment): a direct delete could drop a parent before a child's repointing rebuild applies [Q8]
- Heal deletes the lookup row when the source is gone, in the same T1 [Q8]
- Error handling: `isConcurrentHardDeleteConflict` matches SQLSTATE `40001` anywhere in the error chain. Model, patient and heal loops log warn and rethrow with a cause; the outer catch logs warn; T1 rolls back [Q8]
- No tombstone is produced for a hard delete; the row stops being served (`inference`) [Q8]

## 10. Drift and healing
- `needs_rebuild` is set only by `flag_for_rebuild_in_sync_lookup(record_type, record_id)`, called by [Q9]:
  1. AFTER INSERT OR UPDATE trigger `flag_<table>_for_lookup_rebuild` (function `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled`) when `syncTrigger = 'disabled'` (migrations' mode)
  2. The hard-delete trigger (section 9)
  - Trigger is AFTER because BEFORE sees NULL for stored generated columns (a stub got a NULL `record_id`), PR #11659 [LKP-49]
  - Both installed per lookup-tracked table, central only, by post-migration hooks; no runtime code calls the function directly
- Disabled mode exists because migrations are deterministic and re-stamping ticks would resync large data (comment in `preMigrationHooks.ts`) [LKP-23]
- Heal pass (`healFlaggedLookupRows`): per model, rebuilds rows `WHERE id::text IN (flagged record ids)` with `preserveExistingTick`; then deletes flagged rows whose source is gone. Preserving the tick: the source tick has not moved, so facilities do not re-pull held records [Q9]
- Patient rebuild pass: rows whose `patient_id` is in `lookupPatientsToRebuild` are rebuilt with a new tick (not preserved) so facilities re-pull. Flagged after a merge by `mergePatient.js` and `PatientMergeMaintainer.js`, plus a seed migration for past merges. Reason (PR #10862): a merge leaves rows scoped to the merged-away patient, so those records reach no facility and a synced child can halt a pull on a foreign-key violation [LKP-26, Q9]
- Per-model full rebuild: `lookupModelsToRebuild` fact, set by about 28 migrations via `flag_lookup_model_to_rebuild`, not by runtime code. Selects all rows (`> -1`, overriding a custom `where`), cleared by `markLookupModelRebuilt` in T1 [Q9, LKP-23]
- Tick choice during a full rebuild: `CASE WHEN source_tick <= :since THEN source_tick ELSE COALESCE(:updatedAtSyncTick, source_tick) END`. Unchanged rows keep their source tick, changed rows get `-2`. Reason (comment): `since = -1` would lose that boundary. Consequence: a rebuild can move a lookup tick backwards, so it never makes clients re-pull unchanged records [LKP-27]
- Upgrade assertion: `assertSyncLookupTableIsConsistent` builds a `CentralSyncManager`, runs `updateLookupTable()`, throws if any row has `needs_rebuild`. Called by the `upgrade` subcommand (skipped for `--dry-run`, exit 1 on failure) and `rebuildSyncLookup`. `just-migrate` does not gate. Untested [Q9]
- A separate best-effort NOTIFY listener (`registerSyncLookupUpdateListener`, API process) re-stamps child rows when a record's `patient_id` changes [Q10]

## 11. How a pull reads it
`snapshotOutgoingChanges` lookup branch (SOC), one chunked `INSERT ... SELECT FROM sync_lookup` per call, inside the pull's repeatable-read transaction; called up to three times per pull. Conjunction of [PLL-52, LKP-07]:

1. Tick: `updated_at_sync_tick > :since`
2. `data IS NOT NULL` (drops stubs; tombstones stay)
3. Paging by `id > :fromId`
4. `(patient clause AND scope clause) OR is_lab_request IS TRUE` (lab arm only if `syncAllLabRequests`, which is off for mobile and initial pulls). The lab arm bypasses patient, facility and network clauses [PLL-55, LKP-17]
   - Patient: `getPatientRelatedWhereClause`
   - Facility and network scope: `(facility_id IS NULL AND sensitive_network_id IS NULL) OR facility_id IN (:facilityIds) [OR sensitive_network_id = :sensitiveNetworkId]`. Comment: a network-scoped row has null `facility_id` too, so testing facility alone would admit every sensitive record everywhere (PR #10903)
5. `record_type IN (:recordTypes)`
6. Avoid-repull: `pushed_by_device_id` filter (section 8)

- Network arm only if the session's facilities resolve a network; more than one network throws. A network row still needs its patient marked [PLL-52, sensitive-networks spec]
- "All record types are patient-linked" optimisation: if every record type in the pass is in `getPatientLinkedModels` (models declaring `buildPatientSyncFilter`), the clause is `patient_id IN (marked patients)`, or `FALSE` when none are newly marked; otherwise `(patient_id IS NULL OR patient_id IN (...))`. Introduced by PR #6506 so the full pass with no new patients scans nothing. The second form is not equivalent at `since = -1` if patient-linked rows with null `patient_id` exist (`unresolved`, for example `Notification.patientId` is nullable) [PLL-51]

## 12. Changelog rows
- `getLookupSourceTickRange(since, tick)` selects `sync_lookup_ticks` rows with `lookup_end_tick` strictly between `since` and the pull tick. `minSourceTick` is the first row's `sourceStartTick`; `maxSourceTick` is the last row's `lookupEndTick`, a lookup tick not a source tick, so a slightly wide upper bound [PLL-18, LKP-63]
- Computed once per pull from the incremental `since`, stored in session parameters, reused for all passes [PLL-18]
- Two `findOne` queries ordered on the PK, because loading every row crashed central (about 600k rows, PR #11532); relies on the table never being pruned [PLL-19]
- Consumer: `attachChangelogToSnapshotRecords` reads `logs.changes` for ticks in that range; skipped for mobile or when the range is falsy [PLL-63]

## 13. Where the spec and the code differ
- `lookup-table.md` says the build runs "two passes"; code has three (incremental, flagged-patient rebuild, self-heal) [LKP drift]
- Spec says snapshots "read exclusively from the lookup table"; code reads it only when `sync.lookupTable.enabled` (default true); the old path remains, lacks network scoping, and `buildFacilityBootstrap` still uses model filters [PLL-39, PLL-39a]
- Spec says a full rebuild takes each row's tick "from its source record"; code does that only for rows at or below the last cursor, changed rows get the pending flag [LKP-27]
- Spec says the migration process runs the build as its final step; only the `upgrade` subcommand does, not `just-migrate` [Q9]
- Spec says a build aborts on a concurrent hard delete; code treats any 40001 the same way [LKP-53]
- Spec omits: `pushed_by_device_id`, the pending `-2` flag detail, `lookupModelsToRebuild` and `lookupPatientsToRebuild` facts, `sync_lookup_ticks`, `sync_device_ticks`, the startup refusal before the first build [LKP drift]
- PR #10485 body says the delete trigger deletes the lookup row and names `remove_from_sync_lookup_on_hard_delete`; code flags instead (`flag_sync_lookup_for_rebuild_on_hard_delete`); the spec is right [LKP-48]
- `sensitive-networks.md` matches the code on the admit clause, lab-request precedence and rescoping leaving ticks alone [PLL-52, LKP-27]
