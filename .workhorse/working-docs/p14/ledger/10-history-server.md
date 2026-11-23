# Server-side sync: history of past fixes (dragons live here)

Raw material mined from `git log` and PR bodies for central server sync, the shared database sync code under `packages/database/src/sync`, and sync-related migrations and triggers. Line numbers are as of worktree HEAD `61e7060846`. PRs are cited by number; keys in titles (TAM-, SAV-, TAMOC-, COOL-, KAM-) are recorded but not opened. Where a fix lives only on an unmerged branch, the entry says so, because the dragon is still live at HEAD.

Facility-side companions are included only where they are the other half of a central fix.

## Ticks, clock and in-flight edits

### HIS-01 A snapshot must wait for every pending edit that holds an older tick
PR: #4086 (2023-05-23), #4112 (2023-05-23), NASS-769. Earlier basis: #3586 (2023-02-23) renamed the wait helper.
Symptom: (not stated in the PRs) records could be missing from a pull even though they were committed with a tick below the snapshot's tick.
Cause: write transactions take a shared advisory lock keyed on the sync tick they stamp, and a snapshot only waited for the previous tock. A transaction that read an older tick and committed after the snapshot began was invisible to it (inference from the diff).
Fix: first waited on every tick in the range (#4086), then replaced with a read of `pg_locks` for shared advisory locks and an exclusive wait on only those ticks below the snapshot tick (#4112, a performance fix: the range wait scaled with the size of the tick range).
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:436-447` (`waitForPendingEdits`, called at 341 for the lookup build and 469 for pull snapshots); `packages/database/src/sync/getSyncTicksOfPendingEdits.ts`; `packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts`.
Lesson: any write path to a synced table must go through the `set_updated_at_sync_tick` trigger so that it takes the tick lock; code that stamps ticks by hand, or reads that bypass the wait, reintroduce missed records. Checkable: a new snapshot or build path calls `waitForPendingEdits` after taking its tick.
Confidence: medium. PR bodies are near empty; mechanism is from the diff and code comments. Inference, not from the PRs: `pg_locks.objid` only holds the low 32 bits of a bigint advisory key, and the query also matches any shared advisory lock, so ticks above 2^32 or an unrelated shared advisory lock would be mishandled.

### HIS-02 Sync tick trigger: read the tick, lock it, then assign it
PR: #7540 (2025-07-25), SAV-947. Migration `packages/database/src/migrations/1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts`.
Symptom: not stated. The title says a race condition in tick updates.
Cause: the previous trigger (`1692710205000-allowDisablingSyncTrigger`) wrote the tick straight into `NEW.updated_at_sync_tick` and then took the shared lock. The PR rewrote it to read into a local, lock, then assign.
Fix: the new function body. In effect the order of operations is the same in both versions, so the diff alone does not show what race it closed.
Guard today: the same ordering is retained in `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts` (current definition, lines 43-69).
Lesson: the lock is taken after the tick is read, so a snapshot that tick-tocks in between can still miss that write; this is why `waitForPendingEdits` only waits for ticks strictly below its own tick (HIS-01). Do not reorder the read, lock and assign steps in the trigger without re-deriving that argument.
Confidence: low. PR body is "See comment inline"; no repro described.

### HIS-03 Records changed by a push need a tick no one else shares
PR: #7772 (2025-06-12), SAV-983.
Symptom: records edited on central while a sync was persisting did not reach facilities.
Cause: those edits could share `updated_at_sync_tick` with the pushed rows. The lookup build attributes rows to a pushing device by joining `sync_device_ticks` on that tick, so unrelated edits were treated as "pushed by that device" and excluded from that device's pull.
Fix: the second `tickTockGlobalClock()` moved inside the persist transaction so later writes (including `adjustDataPostSyncPush` and `bumpSyncTickForRepull`) get a fresh tick.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:763` (tock for the push), `785-787` (second tick-tock), join on `sync_device_ticks` in `packages/central-server/app/sync/updateLookupTable.js:70-75`.
Lesson: the push's tick must be unique to the push. Anything that writes to synced tables after the persist but before the next tick-tock is attributed to the pusher and excluded from its pull.
Confidence: high (PR body states the mechanism).

### HIS-04 Tick, tock: central keeps the tock and gives the tick to the client
PR: #4086, #4112 diffs show `tickTockGlobalClock` returning `{ tick, tock }` only. (No dedicated PR for the original design; this is background for HIS-01 and HIS-03.)
Symptom: n/a.
Cause: central-side edits (imports) must not share a tick with any client's cursor, or a client at that tick misses them.
Fix: the clock is incremented by 2 per session and the odd value is the client's tick.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:127-134`.
Lesson: do not increment the clock by 1, and do not hand the tock to a client.
Confidence: medium (code comment only; no PR body).

## Echoes, repulls and re-pushes

### HIS-05 A device pulled back its own pushed changes
PR: #6545 (2024-10-14), SAV-837.
Symptom: with the lookup table enabled, a facility re-pulled records it had pushed in the previous session.
Cause: `removeEchoedChanges` only deletes echoes pushed and pulled within one session; the lookup table is built later, so previous-session pushes were served back.
Fix: the device id is passed to the pull and push (`SyncDeviceTick` row per persist, `pushed_by_device_id` on lookup rows) and the lookup snapshot excludes rows pushed by the asking device.
Guard today: `packages/central-server/app/sync/snapshotOutgoingChanges.js:296-299`; `packages/central-server/app/sync/updateLookupTable.js:52,70-75,115`; `packages/central-server/app/sync/CentralSyncManager.js:782`; same-session echoes in `packages/database/src/sync/removeEchoedChanges.ts`. Gated by `sync.lookupTable.avoidRepull`.
Lesson: echo suppression relies on three things holding together: the device tick row exists for the persist tick (HIS-06), that tick is unique (HIS-03), and the lookup row records the device. Break any one and a facility re-pushes or re-pulls everything.
Confidence: medium (empty PR body; diff and code).

### HIS-06 The device tick must commit with the rows it describes
PR: #11057 (2026-09-21).
Symptom: a facility repulled everything it had just pushed after a roughly 940k-row persist. "Seen in production."
Cause: `SyncDeviceTick` was inserted after the persist transaction committed, so a crash in that window left committed rows with no device attribution for good.
Fix: insert the device tick inside the persist transaction.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:782`.
Lesson: anything that makes committed data interpretable (attribution, ack markers) must be written in the same transaction as the data.
Confidence: high (PR body).

### HIS-07 Do not echo central's own soft-deletes and restores back
PR: #11055 (2026-09-28), TAM-7120.
Symptom: a roughly 800k-row bulk delete on central produced an equal-sized push from the facility that pulled it.
Cause: records pulled from central carry the `INCOMING_FROM_CENTRAL_SERVER` (-1) sentinel so the trigger stores -999 and the facility never pushes them. Paranoid `destroy()` and `restore()` left the tick out of their `SET` clause, so the trigger stamped the current tick instead.
Fix: write `deleted_at` and the tick in one statement through `bulkCreate` and `update`. Knock-on: central now discards client-supplied `deletedAt` so a stale mobile edit cannot silently restore a record central has deleted; `saveUpdates` restricts writes to model attributes so a raw `deleted_at` key cannot override the decision.
Guard today: `packages/database/src/sync/saveChanges.ts:1-12,29-35,42-82`; `packages/database/src/sync/resolveAppointmentSchedules.ts` (model query instead of raw `SELECT *`).
Lesson: on the facility, any write of pulled data must carry tick -1 in the same statement; separate `destroy()`/`restore()`/follow-up updates stamp the current tick and cause echoes. Do not pass raw snake_case rows into `Model.update`: Sequelize writes unknown keys verbatim.
Confidence: high (PR body and diff).

### HIS-08 Push acknowledgement is not crash-safe (fix exists only on a branch)
PR: none merged. Commit `2f9f127f00` (2026-09-10) on `origin/tam-7120-3-crash-safe-push-acknowledgement`.
Symptom: a crash after the persist transaction committed but before `persistCompletedAt` was set made the client treat the whole push as failed and re-push the entire payload next session; combined with HIS-06 and HIS-07 this made a roughly 940k-row re-push loop over days.
Cause: `adjustDataPostSyncPush`, `bumpSyncTickForRepull` and the persisted mark run after the persist transaction commits.
Fix (branch only): move those steps inside the persist transaction; add a read-only push status endpoint and a pending-push fact.
Guard today: not merged. At HEAD the steps are still outside the transaction at `packages/central-server/app/sync/CentralSyncManager.js:790-800`, with a warning comment at 801-802 and a restart check in `checkPushComplete` (896-914).
Lesson: the window between persist commit and `persistCompletedAt` is still open at HEAD. Do not add more work in that window, and do not treat a missing `persistCompletedAt` as proof nothing was persisted.
Confidence: medium (commit message only; unmerged).

### HIS-09 Pulled records overwrite local edits made between push snapshot and pull
PR: #4599 (2023-09-15), SAV-286; follow-ups #11269 (2026-10-14, TAM-7120) and #11314 (2026-10-12). Facility-side, recorded because it is the other half of the push/pull protocol.
Symptom: a record edited locally after the push snapshot and also pulled from central was overwritten, and the edit was never pushed.
Cause: pulled data is saved with the not-to-push sentinel; the local edit's higher tick is lost.
Fix: assert, before saving a pull, that no pulled record changed after the push snapshot, and throw to restart the sync. #11269 removed the `is_deleted IS FALSE` filter so pulled deletes are covered; #11314 replaced `COUNT(*)` with `EXISTS`.
Guard today: `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js`; call at `packages/facility-server/app/sync/FacilitySyncManager.js:349`. Config key `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot`.
Lesson: every pulled-record write path (deletes included) needs a "changed since push snapshot" check; an assertion that skips deleted rows silently drops edits.
Confidence: high for #4599 and #11269 (diffs and comments); medium for #11314 (empty body, perf only).

### HIS-10 Empty last page from central crashed the facility pull loop
PR: #10326 (2026-07-28). Facility side.
Symptom: the whole sync failed with a TypeError.
Cause: the loop destructured `records[records.length - 1]` before checking for an empty page. Empty final pages are reachable when central's `totalToPull` diverges from the dependency-ordered pull query.
Fix: the empty-page break moved above the destructure; regression test added.
Guard today: `packages/facility-server/app/sync/pullIncomingChanges.js`, `__tests__/sync/pullIncomingChanges.test.js`.
Lesson: treat `totalToPull` as an estimate; the pull loop must end on an empty page, not a count.
Confidence: high (PR body).

## Session lifecycle, capacity and connection pool

### HIS-11 Concurrent snapshot cap raced between check and claim
PR: #3566 (2023-02-22), #3586 (2023-02-23), SAV-127.
Symptom: more snapshots than the cap ran concurrently.
Cause: a gap between "is there capacity" and "record that this snapshot has begun" let two sessions both see capacity.
Fix: `snapshot_started_at` column; the check and state update are one `UPDATE ... FROM in_flight_snapshots` query.
Guard today: `packages/central-server/app/sync/startSnapshotWhenCapacityAvailable.js:3-38`; caller `CentralSyncManager.js:462`.
Lesson: a single statement that counts and updates is not a mutex under READ COMMITTED. Inference: two concurrent callers can still both pass; the later session-creation cap needed an explicit advisory lock for the same reason (HIS-14).
Confidence: medium (PR body for the race; the residual-race point is inference).

### HIS-12 Snapshot concurrency can exhaust the database connection pool
PR: #3709 (2023-03-16), EPI-396.
Symptom: connection pool exhaustion during long syncs.
Cause: `numberConcurrentPullSnapshots` was 4 and the default Sequelize pool was 5.
Fix: pool configurable, default 10, startup warning if pool max is within 4 of the concurrency.
Guard today: `packages/central-server/app/subCommands/startApi.js:36-47`.
Lesson: every long-lived sync holder (snapshots, advisory-lock transactions, HIS-13 and HIS-15) costs a connection; raising any sync concurrency knob must be checked against `db.pool.max`.
Confidence: high (PR body).

### HIS-13 Server restart during session start leaves a session that looks alive forever
PR: #6223 (2024-09-17), SAV-777.
Symptom: sessions stuck after a central restart during initiation. PR body: "apply same pattern as restart handling during snapshots".
Cause: preparation ran in the background with no marker that would vanish if the process died.
Fix: `markSessionAsProcessing` takes a transaction-level advisory lock keyed on the session id (released if the process dies, readable across cluster processes); `prepareSession` catches errors and marks the session errored; readiness checks treat "not processing and never started" as an error.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:136-211,277-303,653-693,896-914`.
Lesson: background session work must hold a session lock and release it in `finally`; a session with no lock and no completion marker must be errored, never waited on.
Confidence: medium (short PR body; diff clear).

### HIS-14 A throw inside `setTimeout` does not cancel a long snapshot
PR: #6182 (2024-07-23), #6251 (2024-08-06), SAV-740; the hotfix was cherry-picked to several release branches (#6173, #6178-6181, #6241, #6248-6250).
Symptom: long-running syncs needed to be cancelled automatically.
Cause: #6182 threw from a `setTimeout` callback inside the snapshot transaction, which cannot abort the awaiting work (inference from the diff).
Fix: #6251 replaced it with a session timeout checked in `connectToSession` (`syncSessionTimeoutMs`), which errors the session on the next poll.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:228-235`. The old timer code is back at `572-577` and `647` (config `snapshotTransactionTimeoutMs`, default null), still unable to abort the snapshot. It came back through the lookup-table merge (#6167, #6407).
Lesson: a timeout that throws inside a timer callback is a no-op for async work; cancel by erroring the session and having the worker observe it. Do not rely on `snapshotTransactionTimeoutMs`.
Confidence: medium (diffs; no PR bodies).

### HIS-15 Failed session creation leaked the lock and its connection
PR: #8275 (2025-08-25), TAMOC-333.
Symptom: `SequelizeConnectionAcquireTimeoutError` when several syncs started together, ending in a fully deadlocked server.
Cause: several syncs grab locks, then no connection is left to create the session; a failed create never released the lock, holding a connection forever, pool shrinking each time.
Fix: try/catch around session creation that always unlocks.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:146-165`.
Lesson: every `markSessionAsProcessing` or `takeCreateSessionLock` must have a matching release on every path including errors; a held advisory-lock transaction is a held connection.
Confidence: high (PR body).

### HIS-16 `maxConcurrentSyncSessions` exceeded when starts raced
PR: #9181 (2026-03-02), COOL-38.
Symptom: more active sessions than the limit when several syncs were requested at once.
Cause: session count is the capacity check; counting then creating was not atomic.
Fix: a non-blocking advisory lock (`pg_try_advisory_xact_lock`) held across capacity check and session creation; losers get `activeSync` and retry.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:91-125`; `packages/central-server/app/sync/buildSyncRoutes.js:117-151`.
Lesson: release the lock only after the row it protects exists. Return a retryable status, never block.
Confidence: high (PR body).

### HIS-17 The snapshot transaction must never write shared rows
PR: #7691 (2025-05-23).
Symptom: database contention on a large deployment ended in Postgres connection exhaustion.
Cause: the snapshot's repeatable-read transaction implicitly promises to only read shared resources. A write to `sync_sessions.debug_info` slipped inside it. In high contention it blocked behind other updates to the session row, cascading to all updates of that table.
Fix: `addDebugInfo` uses `SKIP LOCKED` and drops the data under contention; new `setParameters` does one atomic `UPDATE` for data that must persist; the lookup debug write moved outside the transaction.
Guard today: `packages/database/src/models/SyncSession.ts:55-86`; the comment at `packages/central-server/app/sync/CentralSyncManager.js:636-639` (session update outside the snapshot transaction).
Lesson: inside the snapshot transaction, only read, plus write to the session's own snapshot table. Use `setParameters` for business data and `addDebugInfo` (lossy) for debug.
Confidence: high (PR body).

### HIS-18 Errored sessions orphaned snapshot tables
PR: #9646 (2026-04-23).
Symptom: one on-premises deployment accumulated about 190k orphan tables and hundreds of GB.
Cause: error paths bypass `completeSyncSession`, so `sync_snapshots.{sessionId}` and the marked-for-sync tables were never dropped.
Fix: keep errored snapshots for 24 hours for debugging; a scheduled `SnapshotTableCleaner` drops them in overnight batches, tracked by `sync_sessions.snapshot_dropped_at`.
Guard today: `packages/central-server/app/tasks/SnapshotTableCleaner.js`; `packages/database/src/sync/completeSyncSession.ts:4-19`; config `schedules.snapshotTableCleaner`.
Lesson: any new per-session table or resource needs a cleanup path for errors, not just completion. Check that the cleaner covers it.
Confidence: high (PR body).

### HIS-19 Snapshots live in separate tables, with sequential ids
PR: #3294 (2022-12-13), EPI-297; #6326 (2024-08-23), SAV-810.
Symptom: deleting large snapshots slowed creation of new ones (#3294). #6326 has no body.
Cause: shared-table deletes triggered reindexing lag for everyone (#3294). For #6326 the id column moved from random `uuid_generate_v4()` to `BIGSERIAL` and the paging default from a nil UUID to 0; reason is inference (random keys give unordered paging and index churn).
Fix: one table per session in the `sync_snapshots` schema; `BIGSERIAL` ids.
Guard today: `packages/database/src/sync/manageSnapshotTable.ts`, `findSyncSnapshotRecords.ts`.
Lesson: snapshot rows are paged by id. Keep ids monotonic and keep one table per session; do not add shared snapshot tables.
Confidence: medium (#3294 body); low for #6326.

### HIS-20 Do not accept a session until the lookup table has built
PR: #7818 (2025-06-12) (original #7801).
Symptom: not stated. Before the fix, readiness polling returned "not ready" indefinitely while the lookup table was unbuilt.
Cause: the check sat in `checkPullReady`, after the session had already started.
Fix: check moved to `prepareSession`, which errors the session immediately with a clear message.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:188-194`.
Lesson: a precondition that cannot become true by waiting should fail the session, not poll.
Confidence: low (diff only; empty body beyond the original PR link).

## Pull filtering and the marked-for-sync table

### HIS-21 Inlined patient id lists did not scale
PR: #5869 (2024-06-11), SAV-600.
Symptom: sync filtering scaled badly with the number of marked-for-sync patients (title only).
Cause: patient ids were interpolated into SQL (`IN (:patientIds)`) for every model.
Fix: per-session tables `createMarkedForSyncPatientsTable` (full and incremental) and a patient count used to pick the filter; filters take `(patientCount, markedForSyncPatientsTable, sessionConfig)`.
Guard today: `packages/central-server/app/sync/createMarkedForSyncPatientsTable.js:3-34`; `snapshotOutgoingChanges.js:187-212`; dropped in `completeSyncSession.ts:15`.
Lesson: never inline id lists; use the per-session table. A new patient-linked model's filter must join it, and any new session table needs the cleanup from HIS-18.
Confidence: medium (empty body; diff clear).

### HIS-22 No marked-for-sync patients should not mean a full-table scan
PR: #6506 (2024-09-27), SAV-831.
Symptom: lookup snapshot slow when no patients were newly marked for sync.
Cause: the patient clause was built inline per call and did not short-circuit.
Fix: `getPatientRelatedWhereClause` returns `FALSE` (or `patient_id IS NULL` for mixed record types) when the patient count is zero.
Guard today: `packages/central-server/app/sync/snapshotOutgoingChanges.js:187-212`.
Lesson: the zero-patients case is a performance branch as well as a correctness branch; keep the short-circuit when editing the clause.
Confidence: medium (PR body describes the refactor; the performance reasoning is from the title).

### HIS-23 A child record arriving after its parent's cursor passed
PR: #3236 (2022-11-28), EPI-74; lookup-table version #6435 (2024-09-16); prescriptions #9623 (2026-04-21, backport of #9608).
Symptom: with `syncAllLabRequests` (or all-encounters-for-vaccines), an encounter whose tick the client had passed, followed by a new lab request, was never synced, so the child hit a foreign key violation and the sync failed. For prescriptions, a prescription arrived after its `patient_ongoing_prescription`.
Cause: the parent row is selected by its own tick only, so a later child never re-selects it.
Fix: OR the child's tick into the parent's filter, in both the live filter (#3236) and the lookup build and its `isLabRequest` flag (#6435; originally lab flag stayed false). #9623 mirrors this for patient ongoing prescriptions and rebuilds the lookup.
Guard today: `packages/database/src/models/Encounter.ts:379-433`; `packages/database/src/models/Prescription.ts:258,277`.
Lesson: whenever a child sync filter can pull in a parent by a different route than the parent's own tick, the parent's selection and lookup `where` must also look at the child's tick, in both the live and lookup code paths.
Confidence: high (PR bodies).

### HIS-24 Sensitive-facility scoping missing from lookup rows
PR: #8311 (2025-08-26), #9533 (2026-04-14), #10598 (2026-07-29, TAM-7013), #10619 (2026-08-07, TAM-7103).
Symptom: facilities received rows referencing parents they were not allowed to see, causing FK violations (#9533); ongoing prescriptions leaked from a sensitive facility (#8311, decision: treat ongoing prescriptions as sensitive).
Cause: some models built lookup rows with plain `buildSyncLookupSelect`, leaving `facility_id` NULL, which means "send to everyone". Their parent was filtered, the child was not.
Fix: models use the encounter-linked lookup select/joins that populate `facility_id` for sensitive encounters; migrations rebuild the existing rows.
Guard today: `packages/database/src/sync/buildEncounterLinkedLookupFilter.ts` (`ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE`); `packages/database/src/migrations/1785372544730-RebuildLookupTableForSensitiveFacilityScopedModels.ts`; scope test in `snapshotOutgoingChanges.js:262-291`.
Lesson: a new synced model that hangs off an encounter or patient needs scope columns in its lookup select, and an existing model whose scoping changes needs a lookup rebuild migration. NULL scope means everyone.
Confidence: high for #9533 (PR body); low for #10598 and #10619 (empty bodies).

### HIS-25 Lookup rebuild skipped rows when a custom `where` was present
PR: #8404 (2025-09-15, TAMOC-331); #9958 (2026-06-03, TAM-6834).
Symptom: lookup rows stale for prescriptions after a model change; later, a forced rebuild of a model with a custom `where` still only selected recent rows.
Cause: the "rebuild model" fact (#8404) made the default `where` use `-1`, but a model-specific `where` ignored it.
Fix: #9958 makes a full rebuild always use `updated_at_sync_tick > -1`, ignoring the custom incremental `where`.
Guard today: `packages/central-server/app/sync/updateLookupTable.js:150-158`; `LocalSystemFact.isLookupRebuildingModel` and `markLookupModelRebuilt` (`updateLookupTable.js:394-412`).
Lesson: a custom incremental `where` is not a rebuild `where`. A rebuild migration for a model needs a test with a model that has a custom `where`.
Confidence: medium (#9958 empty body; diff clear).

### HIS-26 Data changes need a lookup rebuild or flag
PR: #9213, #9476, #9820 (and release backports #9813-9819), #8404, #9533.
Symptom: facility pulls failed saving rows after a schema change (for example `procedures` rows still carrying a removed `assistantId: null` in the lookup payload, #9820).
Cause: `sync_lookup` stores a denormalised copy (`data`) built when the row last changed; a migration that changes columns, or moves data without moving the tick, leaves stale payloads.
Fix: ad-hoc rebuild migrations per change, replaced systematically by the needs-rebuild flag (HIS-27).
Guard today: HIS-27, plus rebuild migrations such as `1755227673457-AddLookupModelsToRebuildFact.ts`.
Lesson: any migration that adds, removes or reshapes columns on a lookup-tracked model needs the lookup rebuilt for that model.
Confidence: medium (#9820 body; others have empty bodies, confirmed by titles only).

### HIS-27 Migrations (disabled-trigger writes) silently drift the lookup
PR: #10485 (2026-07-30, TAM-6930).
Symptom: migrations changed source data without advancing the sync clock, so `sync_lookup` served stale or missing data.
Cause: with `local_system_facts.syncTrigger = 'disabled'` writes carry no new tick, so the incremental build never sees them.
Fix: migrations disable the trigger instead of dropping it; writes made while disabled flag the lookup row `needs_rebuild`, stubbing a row if needed; stub rows (`data IS NULL`) are excluded from snapshots; a second self-heal pass rebuilds flagged rows in the same transaction; hard deletes flag rather than delete (so dependent rows change together); the upgrade or migrate command refuses to finish if any row is still flagged. A concurrent hard delete aborts the build with a serialisation failure (`FOR KEY SHARE`), treated as expected.
Guard today: `packages/central-server/app/sync/updateLookupTable.js:12-17,99-106,289-350`; `packages/central-server/app/sync/assertSyncLookupTableIsConsistent.js`; `packages/central-server/app/sync/CentralSyncManager.js:398-408,417-421`; `packages/database/src/migrations/1784601991763-addNeedsRebuildToSyncLookup.ts`, `1784602019354-flagSyncLookupForRebuildOnDisabledTrigger.ts`, `1784602090407-addSyncLookupHardDeleteTrigger.ts`; self-heal keeps the existing tick (`syncLookupSelfHeal.test.ts`). Spec: `specs/sync/lookup-table.md`.
Lesson: a data fix migration must run with the trigger disabled so it is flagged, not with ticks bumped; do not bump ticks by hand. Cast ids to text when comparing against `sync_lookup.record_id` (uuid keys otherwise raise "operator does not exist: text = uuid"; commit messages of the PR's follow-ups).
Confidence: high (long PR body, commit messages and spec).

### HIS-28 Flagging in a BEFORE trigger sees NULL generated ids, and migration order matters
PR: #11659 (2026-11-12), #11662 (2026-11-12).
Symptom: the migrator job failed with a NULL `record_id` violation on `sync_lookup`.
Cause: the disabled-mode flag used `NEW.id` in the BEFORE ROW trigger, where stored generated columns are NULL; `translated_strings`, `user_preferences` and `patient_facilities` have generated ids. Then the fix migration sorted after the migration that needed it, so the batch stopped before reaching it.
Fix: flag in a dedicated AFTER INSERT OR UPDATE trigger installed by the post-migration hook; the fix migration renamed to sort just before the failing one and made idempotent.
Guard today: `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`; `packages/database/src/services/migrations/hooks/postMigrationHooks.ts:109-135`.
Lesson: BEFORE triggers cannot read generated columns; and a migration that fixes the environment for a later migration must have a timestamp below it. Check migration timestamps relative to the migrations they unblock.
Confidence: high (PR bodies).

### HIS-29 `sync_lookup.record_id` too narrow
PR: #9953 (2026-06-06), TAM-6832.
Symptom: not stated.
Cause: (inference) record ids longer than 255 characters (for example composite translated-string ids) did not fit `varchar(255)`.
Fix: `record_id` (and snapshot `direction`, `record_type`, `record_id`) changed to `text`.
Guard today: `packages/database/src/migrations/1780449878598-changeSyncLookupRecordIdToText.ts`; `manageSnapshotTable.ts` (snapshot DDL).
Lesson: keep sync bookkeeping columns as `text`, never `varchar(n)`.
Confidence: low (empty PR body; reason is inference).

### HIS-30 Central-scope settings leaked to every facility
PR: #11388 (2026-10-12).
Symptom: central-only settings, including credentials, reached every facility.
Cause: lookup rows are scoped by facility, and central-scope settings have none, which means everyone. Secrets are encrypted with a key every facility holds.
Fix: a model can give its lookup a `filter` that holds on every build including full rebuilds; settings exclude `scope = 'central'`; an upgrade step removes existing rows from central's lookup and from facilities. Mobile still receives them (not cleaned up).
Guard today: `packages/database/src/models/Setting.ts:256`; `packages/central-server/app/sync/updateLookupTable.js:123-168` (`filter`).
Lesson: NULL scope means "all facilities and mobile"; a new model with a "central only" subset needs an explicit lookup `filter`. Mobile is a separate leak path.
Confidence: high (PR body).

### HIS-31 Initial sync loaded every `sync_lookup_ticks` row into memory
PR: #11532 (2026-10-29).
Symptom: first sync from a new device ran central out of memory on long-lived deployments (about 600k rows against a 512 MB heap), retried every minute.
Cause: `getLookupSourceTickRange` loaded every tick row as a model just to read the first and last.
Fix: fetch only the two end rows.
Guard today: `packages/central-server/app/sync/getLookupSourceTickRange.js:13-41`.
Lesson: `sync_lookup_ticks` grows by a row per lookup update and is never pruned; never load it whole.
Confidence: high (PR body).

### HIS-32 Whole-table `updated_at_by_field` aggregation (open at HEAD)
PR: none merged. Commit `501b8b0ecf` (2026-10-14) on `origin/lookup-blowup`.
Symptom: possible out-of-memory (commit title).
Cause: the snapshot and lookup queries compute `sum(value) FROM json_each(updated_at_by_field)` grouped over the entire table, then join, regardless of how few rows the page returns.
Fix (branch only): a correlated per-row subselect.
Guard today: not merged. The aggregate join remains at `packages/central-server/app/sync/snapshotOutgoingChanges.js:71-93` and `packages/central-server/app/sync/updateLookupTable.js:70-87`.
Lesson: `coding-rules.md` "bound the work by what the response returns" applies here.
Confidence: low (commit message only).

## Patient merge and display ids

### HIS-33 Patient merge soft-deleted children on facilities
PR: #7847 (2025-06-27), TAMOC-296 (cherry-pick of a 2.30 hotfix #7829); related #7054 (2025-01-17, SAV-808).
Symptom: after a merge, dependants of the merged-away patient were soft-deleted on facilities, including notes.
Cause: the generic cascade-delete hook on the facility deletes every dependant of a deleted parent that does not arrive in the same pull, so the tombstone cascaded.
Fix: re-stamp dependants in the merge transaction (`updateDependentRecordsForResync`, then `refreshChildRecordsForSync`), also in `PatientMergeMaintainer`; setting `patientMerge.updateDependentRecordsForResyncEnabled`.
Guard today: superseded by HIS-34: `packages/central-server/app/admin/patientMerge/mergePatient.js:478-481`, `packages/central-server/app/tasks/PatientMergeMaintainer.js:134`; the update listener `registerSyncLookupUpdateListener.js` still calls `refreshChildRecordsForSync`.
Lesson: deleting a parent on central cascades through the facility hook, so any parent tombstone must arrive with its dependants in the same pull.
Confidence: medium (PR body is generated summary; diff and comments).

### HIS-34 Merge left lookup rows scoped to the merged-away patient
PR: #10862 (2026-09-06).
Symptom: records scoped through the merged patient reached no facility, and a child that did sync halted the facility pull on an FK violation.
Cause: repointing `patient_id` misses join-derived scope.
Fix: the merge flags the patient for rebuild; the build re-derives every row still scoped to them with a fresh tick; the child walk was deleted; the maintainer flags only patients it repointed this run; a migration seeds already-merged patients, capped by `sync.maxFlaggedPatientsPerBuild` (1000). The flag write takes a whole batch in one statement (per-patient calls took 42 s for 10k, 24 ms now).
Guard today: `packages/central-server/app/sync/updateLookupTable.js:380-392`; `packages/database/src/models/LocalSystemFact.ts:146`; `CentralSyncManager.js:391-396`.
Lesson: flag, do not walk children. Mark rebuilt only the ids actually rebuilt (a patient flagged mid-build must survive). Batch fact writes in one statement.
Confidence: high (PR body).

### HIS-35 Duplicate display ids on pushed patients
PR: #7055 (2025-01-25, SAV-807), #7168 (2025-02-06).
Symptom: a unique-constraint failure when a pushed patient's display id already exists.
Cause: two patients (one pushed, one on central) with the same display id.
Fix: an incoming sync hook renames the existing patient to `_duplicate_1` and the incoming one to `_duplicate_2`, as snapshot inserts and updates, then bumps ticks so both repull (`bumpSyncTickForRepull`). #7168: an updated patient was matching itself and being renamed, so the query excludes the incoming ids.
Guard today: `packages/database/src/sync/resolveDuplicatedPatientDisplayIds.ts`; `incomingSyncHook.ts`; `CentralSyncManager.js:767,793`.
Lesson: the hook runs on every push of patients, so it must exclude the pushed record itself; records it modifies need `bumpSyncTickForRepull`.
Confidence: medium (empty bodies; diffs).

### HIS-36 Display id resolution was case-sensitive and crashed on a missing display id
PR: #11540 (2026-10-29).
Symptom: case-only duplicates (`ABC123` vs `abc123`) slipped past the resolver; a pushed patient with no display id threw a TypeError and failed the whole push.
Cause: three places compared exact case (lookup, collision intersection, incoming filter), and the code assumed every pushed patient had a display id.
Fix: all comparisons fold case; the renames keep casing; patients without a display id are skipped.
Guard today: `packages/database/src/sync/resolveDuplicatedPatientDisplayIds.ts:20-74`.
Lesson: keep the resolver's case rules in step with the UI's duplicate check (patient search and edit-time check); one bad pushed record must not fail the batch.
Confidence: high (PR body).

### HIS-37 Rewriting a snapshot row mangled its changelog array
PR: #10957 (2026-09-09; title says "display_id collision").
Symptom: the display id dedupe broke sync (title); mechanism from the diff.
Cause: the snapshot table has no Sequelize model, so `changelog_records` (an array) was written through node-postgres, which serialises arrays as a Postgres array literal that a JSON column rejects.
Fix: stringify `data` and `changelog_records` in both insert and update helpers.
Guard today: `packages/database/src/sync/manageSnapshotTable.ts:84-125`.
Lesson: any value written to the snapshot table that is JSON (especially arrays) must be stringified; the dedupe hook rewrites rows that always carry a changelog array.
Confidence: medium (empty PR body; diff and test describe it).

## Persisting incoming changes

### HIS-38 Hooks during persist cause mid-transaction side effects
PR: #9711 (2026-05-06); backports #9713, #9717, #9718.
Symptom: unexpected side effects and constraint violations against other incoming data.
Cause: Sequelize model hooks fired per record inside the persist transaction.
Fix: `hooks: false` on every create, update, destroy and restore in persist. Knock-on: with hooks off, `validate()` no longer returns the instance, so `id` slipped into `SET` and Postgres rejected GENERATED ALWAYS `id` columns; `id` is now stripped from update payloads.
Guard today: `packages/database/src/sync/saveChanges.ts:2-3,34,71-80`.
Lesson: persist must stay hookless; side effects belong in `incomingSyncHook` or post-persist steps. When adding models with generated `id`, check the update path.
Confidence: high (PR body and in-code comments).

### HIS-39 Creates before updates break unique constraints within a batch
PR: #10515 (2026-09-07), TAM-7004.
Symptom: spurious unique violation when a rename and a reuse of the freed value landed in one batch (for example a report renamed away from "cat" while a new "cat" is created).
Cause: sync applies all creates before updates.
Fix: unique constraints on syncable tables made `DEFERRABLE INITIALLY IMMEDIATE`; `withDeferredSyncSafeguards` defers FK and unique constraints in the apply transaction. Partial and expression indexes cannot be deferred and are whitelisted by name. `Invoice.addItemToInvoice` was rewritten off `upsert()` (ON CONFLICT cannot target a deferrable constraint) with an advisory lock.
Guard today: `packages/database/src/sync/withDeferredSyncSafeguards.ts:28-81`; `CentralSyncManager.js:769`; `packages/central-server/__tests__/sync/uniqueConstraintDeferrability.test.js` fails CI for a new non-deferrable unique constraint.
Lesson: every new unique constraint on a synced table must be deferrable or whitelisted with a reason; `ON CONFLICT` and deferrable constraints are incompatible.
Confidence: high (PR body and test).

### HIS-40 Changelog rows inserted before their referenced user (revert and replacement)
PR: #10018 (2026-06-29), reverted and replaced by #10169 (2026-07-01).
Symptom: a facility pull looped forever on `changes_updated_by_user_id_fkey`.
Cause: changelog rows replay inside each record's batch; the dependency sort emits ready models alphabetically, so `users` saved after models like `invoice_price_lists`. `ChangeLog` is `DO_NOT_SYNC`, so its dependency on `User` was invisible.
Fix: #10018 injected the changelog dependency into the sort; #10169 reverted it and made the FK deferrable (`1782783331515-makeChangesUpdatedByUserIdFkeyDeferrable.ts`).
Guard today: deferrable FK only. `packages/database/src/utils/sortInDependencyOrder.ts` has no cycle guard (the `while` loop does not check progress), inference from the revert diff.
Lesson: FKs that sync cannot see through model associations need to be deferrable; extending the sort is not enough. The cross-batch user-edited-by-user edge is a known limit.
Confidence: high for the mechanism (PR body); the missing cycle guard is inference.

### HIS-41 Pushed records are validated for model and direction
PR: #8974 (2026-01-16), KAM-463.
Symptom: n/a (hardening).
Cause: pushed changes were not checked against the model's sync direction before being stored in the snapshot.
Fix: `addIncomingChanges` rejects unknown record types and models whose direction is not push (or push-then-delete or bidirectional), logs the rejected record on the session, fails the session.
Guard today: `packages/central-server/app/sync/CentralSyncManager.js:810-870`.
Lesson: a new model needs the right `syncDirection`; this check is what stops a facility pushing `PULL_FROM_CENTRAL` or `DO_NOT_SYNC` tables.
Confidence: high (PR body).

### HIS-42 Pushes with external effects must be sanitised on central
PR: #11730 (2026-11-20), Y15; refactors #11764, #11769.
Symptom: a facility could push `PatientCommunication` or `ReportRequest` rows that made central act on local or S3 recipients and files.
Cause: central trusted pushed rows the facility routes would have refused.
Fix: recipients reduced to validated emails, requester permissions checked against the pushing facility's users, and attachments only sent from a dedicated generated-attachments directory; invalid rows go to existing error states; the sanitiser cannot throw.
Guard today: `packages/database/src/models/ReportRequest.ts`, `PatientCommunication.ts`, `Model.ts` (`prepareSanitizeContext`, `sanitizeForCentralServer`), `packages/database/src/sync/saveIncomingChanges.ts`; `specs/sync/pushed-records.md`.
Lesson: a model with an external effect when persisted on central needs `sanitizeForCentralServer`. Known limit: a request may still name a user who can access every facility.
Confidence: high (PR body and spec).

### HIS-43 Sync validation that central skips but facilities run
PR: #8602 (2025-10-30), TAMOC-353.
Symptom: sync stuck forever.
Cause: reference data import inserted translated strings without the model's `validate`, which forbids `;` in string ids; the facility runs validation on pulled records and rejected them.
Fix: replace `;` with `_`; use `TranslatedString.bulkCreate()` so validation runs.
Guard today: the importer and `TranslatedString` validate.
Lesson: the facility applies model validation to pulled records; every central write path must pass the same validation or it wedges every facility.
Confidence: high (PR body).

### HIS-44 Two writers creating "the same" row wedge sync
PR: #10365 (2026-07-14), TAM-6900; #9172 (2026-04-07), COOL-36.
Symptom: a facility's sync permanently wedged on a unique violation (#10365); duplicate `patient_ongoing_prescriptions` broke lookup building (#9172).
Cause: both facility and central created the same logical row with different random uuids; sync classifies incoming rows by `id`, so a full unique index on the logical key conflicts forever.
Fix: single writer (the nightly charger moved to a facility task) (#10365); deterministic ids plus a unique constraint, with audit-log and lookup fix-ups (#9172).
Guard today: `packages/database/src/models/Invoice/Invoice.ts` (bed fee single writer); POP id derivation in `packages/database/src/models/PatientOngoingPrescription.ts`.
Lesson: a record that can be created by both central and a facility needs a deterministic id or a single writer; a unique index on a logical key does not stop the id-based sync path.
Confidence: high (PR bodies).

### HIS-45 Change a push direction, resync the clients
PR: #7746 (2025-05-29), #7742 (2025-05-29), #7751 (2025-05-30), #8304 (2025-08-21), SAV-982, TAMOC-322.
Symptom: mobile tables with a changed schema held stale data after migrations; more than one full-resync record could exist.
Cause: schema changes to synced tables do not move ticks, so existing devices do not repull.
Fix: migrations flagging a full resync; mobile handles several `fullResync` rows; truncate on resync.
Guard today: `tablesForFullResync` in `CentralSyncManager.js:456-465,590-606`.
Lesson: a schema change to a synced table needs a resync plan for mobile as well as the lookup rebuild.
Confidence: low (short bodies; diffs and titles).

## Changelog (audit) sync

### HIS-46 Changelogs reach the facility on the record's own tick
PR: #7687 (2025-05-26, SAV-964), #7562 (2025-05-15), #7667 (2025-05-21), #7665 (2025-05-22).
Symptom: changelogs went missing on the facility-1 to central to facility-2 path; repeated JSON escaping in `record_data`.
Cause: records and changelogs were inserted separately and the changelog's `record_sync_tick` did not match the record's `updated_at_sync_tick`.
Fix: stop using `record_sync_tick`; save changelogs in the same transaction as snapshot records; remove table restrictions; fix double and triple escaping; compute the source tick range once per session.
Guard today: `packages/database/src/sync/saveIncomingChanges.ts:171-173`; `packages/database/src/utils/audit/attachChangelogToSnapshotRecords.ts`; `packages/central-server/app/sync/CentralSyncManager.js:720-735`.
Lesson: changelog sync rides on the `sync_lookup_ticks` range, so it depends on HIS-31 and on a seeded initial tick (#7876, 2025-06-24 backfilled it). A migration that changes `updated_at_sync_tick` columns on audit tables needs the same care.
Confidence: medium (PR bodies for #7687 and #7562).

### HIS-47 Changelog insertion during persist exhausted memory
PR: #10702, #10703, #10701 (2026-08-07), release backports #10717-#10723.
Symptom: out-of-memory during the persist phase of large syncs (titles and #10719 body).
Cause: changelog records were attached and inserted unbatched.
Fix: extract changelogs from batched snapshot records and insert per batch.
Guard today: `packages/database/src/sync/saveIncomingChanges.ts:158-174`.
Lesson: do work per persist batch (`persistedCacheBatchSize`), not per session.
Confidence: low (empty bodies except the cherry-pick note).

## Bootstrap and arrays

### HIS-48 Bootstrap read each table in its own query
PR: #11305 (2026-10-14), Q8, with commit `a305c1f6ad`.
Symptom: a record committed between two table reads could arrive referencing a record the bundle lacked, and the facility could not save it.
Fix: read every table inside one repeatable-read transaction, as the outgoing snapshot does.
Guard today: `packages/central-server/app/sync/buildFacilityBootstrap.js:81-90`; spec `specs/sync/bootstrap.md`.
Lesson: any multi-table read that must be FK-consistent needs one snapshot.
Confidence: high (commit message and PR body).

### HIS-49 `push(...bigArray)` can throw RangeError
PR: #11763 (2026-11-20).
Symptom: none observed ("pre-emptively").
Cause: spreading a large array into `push` exceeds the engine's argument limit.
Fix: loop and push one at a time (bootstrap, facility snapshot).
Guard today: `packages/central-server/app/sync/buildFacilityBootstrap.js:85-88`.
Lesson: do not spread or `concat` unbounded record lists in sync code.
Confidence: medium (diff; empty body).

## Migration and trigger cautions found in the log

### HIS-50 Upgrade steps that depend on the network
PR: #10586 (2026-07-28), TAM-6962. Facility side.
Symptom: facilities that upgraded on a flaky link were left on a config fallback that a later release deletes.
Cause: the step wrote nothing unless it could reach central.
Fix: write offline first; pull the settings key after a completed sync, gated on absence.
Guard today: `packages/facility-server/app/sync/pullSettingsPsk.js`; `FacilitySyncManager.js` post-sync call.
Lesson: an upgrade step whose failure mode is "keep the old thing" must not need the network.
Confidence: high (PR body).

## Recurring themes

1. **Ticks and clock atomicity.** Anything that decides whether a record is visible to a pull rests on tick uniqueness and the pending-edit lock. HIS-01, HIS-02, HIS-03, HIS-04, HIS-06.
2. **Echo suppression is a chain of invariants.** Device tick row, unique tick, the -1/-999 sentinel and lookup attribution must all hold. HIS-05, HIS-06, HIS-07, HIS-08, HIS-09.
3. **Advisory-lock transactions are connections.** Every held lock holds a pool connection; leaks or caps break the server. HIS-11, HIS-12, HIS-13, HIS-15, HIS-16, HIS-17.
4. **The lookup table is a denormalised copy that drifts.** Schema or data changes without a tick bump, a missing child tick, or a missing scope column leave stale or over-shared rows. HIS-23, HIS-24, HIS-25, HIS-26, HIS-27, HIS-28, HIS-30, HIS-34.
5. **NULL scope means everyone.** HIS-24, HIS-30.
6. **FK and unique constraints versus apply order.** Sync creates before updates, and parents arrive by cursor, not by relationship. HIS-23, HIS-39, HIS-40, HIS-44.
7. **Work not bounded by the page or batch.** Whole-table aggregates, all-rows loads, per-session memory. HIS-31, HIS-32, HIS-47, HIS-49, HIS-21, HIS-22.
8. **Central writes the facility will reject.** Validation, hooks and generated ids differ between central and facility apply. HIS-38, HIS-43, HIS-44.
9. **Per-session resources need cleanup on every path.** HIS-15, HIS-18, HIS-19.
10. **Fixes that sit only on a branch.** HIS-08, HIS-32.

## Review checklist candidates

- Does a new write path to a synced table go through the sync tick trigger (so it takes the pending-edit lock), and does it avoid hand-stamping ticks?
- Anything the snapshot depends on for correctness (device tick, attribution, ack marker) is written in the same transaction as the data it describes.
- Pulled-data writes on a facility carry tick -1 in the same statement, for creates, updates, deletes and restores.
- Every advisory lock or lock-holding transaction has a release in `finally`; a new concurrency knob is checked against `db.pool.max`.
- The snapshot transaction only reads (plus the session's own snapshot table). Debug writes use `addDebugInfo`, data writes happen outside it.
- A new lookup-tracked model sets scope columns (patient, encounter, facility, sensitive network); `NULL` scope is intentional and `filter` is used for central-only subsets.
- Any child filter that can pull in a parent by another route also considers the child's tick in both live and lookup paths.
- A migration that changes columns or data on a lookup-tracked model relies on the disabled-trigger flag (or a rebuild), and its timestamp sorts before any migration that depends on it.
- New unique constraints on synced tables are deferrable or whitelisted in `uniqueConstraintDeferrability.test.js`; no new `ON CONFLICT` against them.
- A record both central and a facility can create has a deterministic id or a single writer.
- Central writes that facilities will later validate (for example translated strings) go through model validation.
- No spread or `concat` of unbounded arrays; no whole-table aggregates feeding a paged query; no loading `sync_lookup_ticks` or `logs.changes` whole.
- Per-session tables, files or rows have a cleanup for the error path.
- A new model with an external effect on central implements `sanitizeForCentralServer`.
- Timeouts for async work are enforced by erroring the session, not by throwing in a timer.

## Thin evidence

- HIS-02 (trigger lock order): body "See comment inline"; effective change unclear.
- HIS-04 (tick-tock): no dedicated PR.
- HIS-08 and HIS-32: commit messages on unmerged branches only.
- HIS-10: mechanism confirmed by PR body, but it is facility-side.
- HIS-14: diffs only; the setTimeout-no-op reading is inference.
- HIS-19 (#6326), HIS-20, HIS-25 (#9958), HIS-29, HIS-35, HIS-37, HIS-45, HIS-47, HIS-49: empty or placeholder PR bodies; cause reasoned from the diff or title.
- HIS-24 (#10598, #10619): empty bodies; only titles and file lists.
- HIS-01 and HIS-11: the `pg_locks` 32-bit key and the READ COMMITTED residual race are my inference, not from any PR.
- Items not mined in depth, to check if the final document needs more: `eca0611970` (stale session cleanups counted as failures), `5e6cc7f7c2`, `ab7b9cea6e` (drop snapshot tables on error, later superseded by HIS-18), #7190 (`PUSH_TO_CENTRAL_THEN_DELETE`), #7054 (patient merge strategies removed), #8768 (facility reports errors to the session).
