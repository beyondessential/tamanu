# Persisting pushed changes, hooks, and conflict resolution (PSH)

Code is main at `22d3edaa36`. Transcript ranges: Part 1 00:05:43-00:18:02, 00:26:03-00:39:00, 01:40:37-02:08:10; Part 2 01:31:47-01:46:00, plus the Part 2 00:37:48 correction about hooks. Test files were read, not run.

## Drift

- PSH-01, PSH-04, PSH-05: "highest tick wins" is only true for field-level merge. At record level the incoming (last to sync) record always wins on central, and tests pin that.
- PSH-03: the "tick" half of the persist tick-tock is thrown away; only the tock is used.
- PSH-13, PSH-26: "hooks do not change data" (Part 2 00:37:48 and 01:33:33) is wrong. The Part 1 01:43:31 version is right: both existing hooks change what gets saved.
- PSH-13: the field-level merge does NOT mark anything for repull. Only incoming sync hooks do.
- PSH-16: persisted-at tick is not "returned from the end of the transaction"; it is used inside the transaction and stored in `sync_device_ticks` inside the same transaction (PR #11057).
- PSH-20: the "duplicate creates" comment names a cause (extra pass for sync-all-lab-requests) that no longer exists, but duplicates can still arise from the full and regular pull snapshots overlapping.
- PSH-24: the transcript says only `isDeleted` creates and restores are handled simply; since PRs #11055 and #11269 delete/restore now ride on the record's own INSERT/UPDATE and client `deletedAt` is discarded.
- PSH-27 (the main open question): a PAD row changed by central's field-merge is attributed to the pushing device and, with the default `avoidRepull: true`, is not sent back to it. Nothing flags it for repull and no test covers it. Verdict: broken (see Open questions answered, Q7).
- PSH-28: `removeEchoedChanges` (the pre-lookup safety net that used `updated_at_by_field_sum`) still runs but cannot fire for incrementally built lookup rows, so it is not a backstop for PSH-27.

## Claims

### PSH-01 Two conflict strategies, both "highest tick wins", at record or field level
Source: Part 1 00:05:43
Verdict: partly
Evidence: Record level: `packages/database/src/sync/mergeRecord.ts:48-52` returns `incoming` whenever either side lacks `updatedAtByField`; no tick is compared. Field level: `mergeRecord.ts:19-44` (`lastWriteWinsPerField`) compares per-field ticks with `pickLatest` (`mergeRecord.ts:5-15`, strict `incoming > existing`, ties keep existing). Both are applied only on central (`packages/database/src/sync/saveChanges.ts:48-61`).
Why: the transcript later corrects itself (Part 1 02:00:54, 02:02:19); the code agrees with the correction. `database/__tests__/sync/mergeRecord.test.ts:19-26` is named `lastSyncWinsPerRecord` and asserts the incoming record wins "ignoring the fact the existing record has the higher sync tick".
Notes: so there are two different rules, last-to-sync-wins (record) and highest-per-field-tick-wins (field).

### PSH-02 A tick-tock that may no longer be needed, left in place
Source: Part 1 00:06:55
Verdict: confirmed
Evidence: `packages/central-server/app/sync/CentralSyncManager.js:758-763` is in `persistIncomingChanges`; the comment says it "used to also be used for concurrency control, but that is now handled by shared advisory locks ... so this is now purely for saving with a unique tick". Quoted in full under Q1.
Why: code comment at that location. First introduced as part of PR #6545 era sync-lookup work (git log -S shows `c329033415`, inference that this is where it was reworded).
Notes: it is not purely cosmetic: the tock is also the `sync_device_ticks` key and the `saved_at_sync_tick` stamp (PSH-16), and the row update inside the transaction serialises other tick-tocks (see Not in the transcript).

### PSH-03 Central ticks the clock by two; client gets the tick, central keeps the tock; no two nodes share a tick
Source: Part 1 00:09:38, 00:10:51
Verdict: partly
Evidence: `CentralSyncManager.js:127-134`: `incrementValue(FACT_CURRENT_SYNC_TICK, 2)` returns `{ tick: tock - 1, tock }`. For session start/snapshot the tick is handed out (`:196`, `:339`, `:467`). In `persistIncomingChanges` only `tock` is destructured (`:763`); the `tick` is discarded and nothing is ever stamped with it.
Why: comment `CentralSyncManager.js:128-131`: the tick is unique to the requesting client, and direct central changes are recorded at the tock so a client at the same tick cannot miss them.
Notes: the end-of-persist tick-tock (`:787`) adds another two, so a persist consumes four ticks. Rows saved in the persist carry the first tock `T`; rows altered after the transaction (adjust, repull bump) carry `T+2`.

### PSH-04 "Highest tick wins" is a blunt but simple conflict rule
Source: Part 1 00:10:51
Verdict: partly
Evidence: see PSH-01 and PSH-22. True for field-level merge only.
Why: n/a.

### PSH-05 Example: facility that synced second looks "more recent" even if it edited earlier
Source: Part 1 00:12:26
Verdict: partly
Evidence: true for a field-level merge, since field ticks are the session ticks of the device that made the edit (`set_updated_at_by_field` stamps `currentSyncTick`, which a facility sets to its session tick at `packages/facility-server/app/sync/FacilitySyncManager.js:287-292`). For a record-level model the later push wins regardless of tick (PSH-22).
Why: baseline migration `packages/database/src/migrations/000_baseline.sql:1113-1164`.

### PSH-06 Conflicts are rare because encounters live on one facility; patient details are more likely to clash
Source: Part 1 00:13:45, 00:14:57, 00:17:01
Verdict: unverifiable
Evidence: design rationale, not enforced in code. The only code consequence is that PAD opts in to field merge (PSH-07).
Why: speaker's recollection (inference).

### PSH-07 A table opts in to field-level resolution; only patient additional data does; the tick of each field is recorded
Source: Part 1 00:14:57, 00:16:01; Part 1 01:57:30, 01:59:01
Verdict: confirmed
Evidence: there is no flag. A model "opts in" by having an `updated_at_by_field` column that the record carries as `updatedAtByField`; `mergeRecord.ts:48-52` switches strategy on both sides having it. Only `patient_additional_data` has the column (`000_baseline.sql:3002`; no later migration adds it), the maintenance trigger (`000_baseline.sql:11454`), and the model attribute (`packages/database/src/models/PatientAdditionalData.ts:91`). Settings does not: `models/Setting.ts:59` is `PULL_FROM_CENTRAL`, with no `updatedAtByField` and no merge. The sync lookup carries only a derived sum (`models/SyncLookup.ts:37`, `updated_at_by_field_sum`, `000_baseline.sql:3990`).
Why: speaker flagged "mixed signals" about settings (01:59:01); it is a no.
Notes: the mobile app also maintains it, in application code (`packages/mobile/App/models/PatientAdditionalData.ts:195-225`), not a trigger. See Q5.

### PSH-08 Field-level merge costs performance, was a proof of concept, and was not rolled out
Source: Part 1 00:16:01
Verdict: confirmed (as far as code can show)
Evidence: costs visible in `buildSyncLookupSelect.ts:35,55`, `updateLookupTable.js:70-80` and `snapshotOutgoingChanges.js:84-91` (sum of `json_each(updated_at_by_field)` per row for models with the attribute). No other table carries it.
Why: rationale not in code; speaker's recollection (inference).

### PSH-09 No sub-field resolution: a JSON value is taken whole
Source: Part 1 00:17:01, 00:18:02
Verdict: confirmed
Evidence: `mergeRecord.ts:22-33` iterates top-level keys only and `pickLatest` returns the whole `existing[key]` or `incoming[key]`.
Notes: `updatedAtByField` itself is rebuilt as a new object (`:34`).

### PSH-10 Clients never compare to local; a locally changed record that is also pulled aborts the sync
Source: Part 1 00:26:03, 00:27:10
Verdict: confirmed
Evidence: facility pull persists with `isCentralServer = false`, so `saveUpdates` takes the incoming record untouched (`saveChanges.ts:60-61`, comment "on the facility server, trust the resolved central server version"; call at `FacilitySyncManager.js:363`). The abort is `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js`: if a pulled record's local `updated_at_sync_tick` is above the last successful push tick it throws and the sync restarts. It runs when `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` is true (`FacilitySyncManager.js:347`; default true at `packages/facility-server/config/default.json5:28`).
Why: file comment. PR #11269 (see Q6) widened it to pulled deletes.
Notes: pulled records are stamped `updatedAtSyncTick: -1` (`pullIncomingChanges.js:56,96`), which the trigger stores as `-999`, so a facility never pushes back what it just pulled.

### PSH-11 Central is the authority on conflicts, the clock and concurrency
Source: Part 1 00:27:10, 00:28:10
Verdict: confirmed
Evidence: merge only on central (`saveChanges.ts:48`); clock is central's `currentSyncTick` fact (`CentralSyncManager.js:132`).

### PSH-12 Persist is "locked" so nothing else can happen during it
Source: Part 1 00:35:22
Verdict: partly
Evidence: `completePush` takes a per-session advisory lock via `markSessionAsProcessing` and runs `persistIncomingChanges` in the background (`CentralSyncManager.js:882-894`); the client polls `checkPushComplete` (`:896-914`). There is no global write lock. What actually serialises against other sessions: the tick-tock `UPDATE local_system_facts` runs inside the persist transaction and holds that row lock until commit, so any other session's tick-tock (session start, snapshot start, lookup build) blocks; and the `set_updated_at_sync_tick` trigger takes `pg_try_advisory_xact_lock_shared(current_tick)` (migration `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:55-63`), which snapshot builders wait on via `waitForPendingEdits` (`CentralSyncManager.js:437-447`).
Why: comment at `CentralSyncManager.js:166-168` (session start "might get blocked ... if the central server is concurrently persisting records from another client"). The row-lock mechanism is inference from Postgres UPDATE semantics.

### PSH-13 Central may tweak records on the way in and mark them to sync back; the merge is one such place
Source: Part 1 00:36:48, 00:38:02; Part 2 00:37:48 (corrected), 01:33:33
Verdict: partly
Evidence: only incoming sync hooks flag repull (`incomingSyncHook.ts:62-77` sets `requiresRepull: true`; `bumpSyncTickForRepull.ts:28-48`). The field merge in `saveUpdates` sets no flag and has no repull path. See PSH-27. Hooks do change data (PSH-26).
Why: n/a.

### PSH-14 completePush marks the session processing and persists in the background, after counting snapshot records for debug
Source: Part 1 01:40:37
Verdict: confirmed
Evidence: `CentralSyncManager.js:737-744` (`countSyncSnapshotRecords`, `addDebugInfo({ beganPersistAt, totalPushed })`), `:882-894`.
Notes: `checkPushComplete` errors the session if `persistCompletedAt` is still null once processing ends (`:903-910`), which is the comment at `:801` ("WARNING: ... persistCompletedAt").

### PSH-15 Persist runs in one transaction; audit is paused for non-mobile pushes
Source: Part 1 01:42:18
Verdict: confirmed
Evidence: `CentralSyncManager.js:752-757`. `pauseAudit` sets the transaction variable `audit.pause` (`packages/database/src/utils/audit/pauseAudit.ts`); `logs.is_audit_changes_enabled()` returns false when it is set (latest definition: migration `1778000000000-retireAuditChangesEnabledSetting.ts:6-17`; baseline `000_baseline.sql:704`), and `logs.record_change()` (latest: `1785457572615-captureHardDeletesInChangelog.ts:19-60`) only writes when that is true.
Why: code comment `:753-754`: "currently we do not create audit logs on mobile devices so we rely on sync process to create audit logs". The facility's own `logs.changes` rows travel with the record and are inserted explicitly (`saveIncomingChanges.ts:173`, `utils/audit/insertChangelogRecords.ts`, which uses `ignoreDuplicates`), so triggering the trigger as well would double-log.
Notes: for mobile pushes the trigger logs with `updated_by_user_id` = `uuid_nil()` unless a user id is set in the session; the persist never sets one (`AUDIT_USERID_KEY` is only set in `packages/database/src/services/database.js:167,182`). That answers the speaker's "I don't know what user". Steps that run after the transaction (adjust, bump) are not paused and are audited normally by the trigger (inference from structure). Records changed only by an incoming hook (for example the renamed existing patient, PSH-26) carry no pushed changelog, so for non-mobile pushes they get no `logs.changes` row (inference).

### PSH-16 "Persisted at sync tick": a tock grabbed in the transaction and returned from it
Source: Part 1 01:42:18, Part 2 01:33:33
Verdict: outdated
Evidence: nothing is returned. `CentralSyncManager.js:782` creates `SyncDeviceTick { deviceId, persistedAtSyncTick: tock }` inside the transaction, after the saves and the `saved_at_sync_tick` update (`:775-780`), before the second tick-tock (`:787`).
Why: PR #11057, "fix(sync): record the device tick inside the persist transaction": it used to be inserted after the transaction committed, so a crash in that gap left rows committed but unattributed and the device repulled everything it had pushed (seen after a very large persist). Tests: `central-server/__tests__/sync/CentralSyncManager.syncDeviceTick.test.js` "is written atomically with the persisted changes" (both directions).
Notes: the `sync_device_ticks.id` is a generated copy of `persisted_at_sync_tick` (`models/SyncDeviceTick.ts:15-24`), which is the primary key, so a tock can be attributed to one device only.

### PSH-17 The comment about the tick-tock being "purely for saving with a unique tick"
Source: Part 1 01:43:31
Verdict: confirmed
Evidence: `CentralSyncManager.js:758-763`.

### PSH-18 Incoming sync hook is declared per model; it may do something with that model's records
Source: Part 1 01:43:31
Verdict: confirmed
Evidence: declared on `Model` at `packages/database/src/models/Model.ts:44-46`; defined on `Patient` (`models/Patient.ts:354`) and `AppointmentSchedule` (`models/AppointmentSchedule.ts:172`) only. Runner: `packages/database/src/sync/incomingSyncHook.ts:16-82`.

### PSH-19 Hooks run in batches, read snapshot records in a transaction, return new JS objects that are inserted flagged requiresRepull
Source: Part 1 01:44:29, 01:45:59
Verdict: confirmed
Evidence: `incomingSyncHook.ts:34-47` batches by `sync.incomingSyncHookBatchSize` (20000, `central-server/config/default.json5:50`) using an id cursor; the hook runs inside `readOnlyTransaction` (`:49-56`, `sync/transactions.ts:30-40`, `SET TRANSACTION READ ONLY`); `inserts` go to `insertSnapshotRecords` and `updates` to `updateSnapshotRecords` by snapshot `id`, each with `requiresRepull: true` (`:60-86`, pool size `sync.persistUpdateWorkerPoolSize`).
Notes: models are visited in `Object.values(models)` order, not dependency order (`:21`). The nested `sequelize.transaction` inside the CLS persist transaction probably opens its own connection and so sees only committed data (inference about Sequelize v6 CLS behaviour; not read in this repo). Return type is `SyncHookSnapshotChanges { inserts, updates }` (`types/sync.ts`), or `undefined`.

### PSH-20 Appointment schedule hook (the speaker does not know it)
Source: Part 1 01:45:59
Verdict: confirmed (content supplied)
Evidence: `packages/database/src/sync/resolveAppointmentSchedules.ts:17-69`. For pushed schedules with `cancelledAtDate`, it finds appointments of those schedules that are not cancelled and whose `start_time` date is after the schedule's incoming `generatedUntilDate`, and returns them as `inserts` with `isDeleted: true`, i.e. they get soft deleted on central. No `updates`.
Why: PR #11055 changed the lookup from a raw `SELECT *` to a model query so snake_case keys like `deleted_at` cannot ride into the SET clause.

### PSH-21 Patient hook resolves duplicate display IDs by suffixing, not merging
Source: Part 1 01:45:59, 01:47:16
Verdict: confirmed
Evidence: `packages/database/src/sync/resolveDuplicatedPatientDisplayIds.ts:25-70`. Compares display IDs case-insensitively against existing patients with a different id; existing patient gets `<displayId>_duplicate_1` (as a new INCOMING snapshot insert built from `sanitizeRecord`), the incoming one is rewritten in place to `<displayId>_duplicate_2` (an `updates` entry). Test: `central-server/__tests__/sync/CentralSyncManager.setupSnapshotForPull.test.js:1086-1098, 1190-1191`.
Why: PR #7055 "Handle duplicated display IDs" (git log -S).
Notes: it does not detect two incoming patients that share a display ID within the same push (it only looks for existing rows whose id is not in the incoming set; inference from the query). The exact format is `_duplicate_1` and `_duplicate_2`, answering the speaker's "unclear".

### PSH-22 Those are the only two hooks
Source: Part 1 01:47:16
Verdict: confirmed for `incomingSyncHook`. A different hook, `adjustDataPostSyncPush`, exists on `Encounter` (`models/Encounter.ts:438`, discharges outpatient encounters via `shared/src/utils/dischargeOutpatientEncounters.js`) and `FacilitySettingMigration` (`models/FacilitySettingMigration.ts:36`, `sync/applyFacilitySettingMigrations.ts`).
Evidence: grep across `packages/` excluding mobile.

### PSH-23 withDeferredSyncSafeguards is a data-integrity wrapper, mostly about logs.changes
Source: Part 1 01:47:16, 01:48:37 (other speaker)
Verdict: wrong about logs.changes
Evidence: `packages/database/src/sync/withDeferredSyncSafeguards.ts:26-77`. It requires an open transaction, finds deferrable FK and unique constraints in `public` that are currently IMMEDIATE, runs `SET CONSTRAINTS ... DEFERRED`, runs the save, then `SET CONSTRAINTS ... IMMEDIATE` in `finally` so violations surface before commit. The doc comment says it is scoped to 'f' and 'u' constraints so the DEFERRABLE INITIALLY DEFERRED changelog triggers stay deferred until commit. So it is about self-referencing FKs and unique constraints mid-batch (examples in the comment: `tasks.parent_task_id`, `invoice_payments.original_payment_id`), not about logs.changes, though it is careful not to disturb it.
Why: comment `:6-10`, `:34-47`. Tests: `central-server/__tests__/sync/withDeferredSyncSafeguards.test.js`, `selfReferencingFkDeferrability.test.js`, `uniqueConstraintDeferrability.test.js`.
Notes: if the final `IMMEDIATE` throws and the operation itself succeeded, that error propagates and aborts the persist; a secondary failure after an operation failure is suppressed.

### PSH-24 saveIncomingChanges: dependency order, batches, id cursor
Source: Part 1 01:48:37, 01:49:59
Verdict: confirmed
Evidence: `packages/database/src/sync/saveIncomingChanges.ts:183-205` orders models with `sortInDependencyOrder` (`utils/sortInDependencyOrder.ts`: orders on non-self `BelongsTo` associations, alphabetical within a level); `:130-181` counts rows per model, computes `batchCount` from `persistedCacheBatchSize` (20000), then loops using `fromId` = last snapshot row id returned (`:152-162`), paged by `findSyncSnapshotRecords` (`id > :fromId ORDER BY id LIMIT`), with a `sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds)` (50 ms) between batches (`:175`).
Why: the cursor reason (no re-scanning from the start) is the speaker's; the `id` index is `*_dir_rec_id_idx` in `manageSnapshotTable.ts:49-57`.
Notes: `sortInDependencyOrder` has no cycle guard (`while` over a shrinking set; a two-model belongs-to cycle would never terminate; inference). Self-references are handled by deferring constraints (PSH-23).

### PSH-25 Changelog extraction and insertion
Source: Part 1 01:49:59, 01:51:22
Verdict: confirmed
Evidence: `saveIncomingChanges.ts:170-173`: `extractChangelogFromSnapshotRecords` strips `changelogRecords` off each snapshot row (`utils/audit/extractChangelogFromSnapshotRecords.ts`), the stripped rows go to `saveChangesForModel`, and the extracted rows go to `insertChangelogRecords` (bulk create, `ignoreDuplicates: true`, batched). This runs on both servers.
Why: speaker's recollection of the design review; not in code.

### PSH-26 Model-specific sanitisation: Attachment and Asset base64 to buffer; facility variant only for asset
Source: Part 1 01:51:22, 01:52:33
Verdict: partly
Evidence: `saveIncomingChanges.ts:33-44` calls `model.sanitizeForCentralServer(record, context)` on central and `sanitizeForFacilityServer` on a facility, defaults at `models/Model.ts:199-215` (identity). Full list under Q8. The speaker says "they only push", which is true of the central variants and wrong in general: `Asset` is pull-from-central and its `sanitizeForCentralServer` is only for manual insertion; `ReferenceDrugFacility` is pull-only and sanitises on the facility.
Notes: the first transcript example of hooks "getting the buffer out of base64" (Part 2 00:37:48) is the sanitisers, not hooks. Also `deletedAt` is stripped after sanitising (`:40`).

### PSH-27 Creates, updates and deletes are split by looking up what exists; the existing-record map is used
Source: Part 1 01:52:33, 01:53:41, 01:54:59
Verdict: partly (code has moved on)
Evidence: `saveIncomingChanges.ts:47-112`. `findByIds(ids, false)` (paranoid off, so soft-deleted rows count as existing; `Model.ts:~185-195`) returns existing rows. Classification:
- Create: incoming id not among existing (`:107-109`).
- Update: every incoming whose id exists, including ones being deleted or restored (`:67`, `:110-112`).
- Delete: existing live and incoming `isDeleted` (`:73-75`), on either server; or a create where ANY copy in the payload is deleted (`:86-90`).
- Restore: facility only, existing deleted and incoming not deleted (`:70-72`).
- Both deleted: nothing (`:76-79`).
There are no separate `saveDeletes`/`saveRestores` functions any more. The decision is attached to the record as `deletedAt` (`now()` for delete, `null` for restore, absent for no decision, `:96-106`) so `deleted_at` is written in the same statement (see PSH-24 notes and Q6).
Why: the `c.data.id` filter at `:47` and `:58` is the "Chesterton's fence" (see Q3).

### PSH-28 Soft-deleted creates are created and immediately soft-deleted
Source: Part 1 01:54:59
Verdict: confirmed, mechanism changed
Evidence: `saveIncomingChanges.ts:82-90` adds the id to `idsForDelete`, `getDeletedAt` returns `fn('now')`, and `saveCreates` bulk-creates with that `deletedAt` in the same INSERT (`saveChanges.ts:29-35`). The deleted_at is the server's `now()`, never a client value. Tests: `database/__tests__/sync/saveChangesForModel.test.ts:76`, `:99`, `:451`.

### PSH-29 Duplicate create records, and its stated cause
Source: Part 1 01:56:12
Verdict: partly
Evidence: `saveChanges.ts:30-34` dedupes by id (`uniqBy`) before `bulkCreate(..., { hooks: false })`. The comment's cause (an extra per-model pass when sync-all-lab-requests is on) is gone: the lookup snapshot is one `INSERT ... SELECT` over `sync_lookup` with `OR is_lab_request IS TRUE` inside the `WHERE` (`central-server/app/sync/snapshotOutgoingChanges.js:230-300`), and `sync_lookup` is unique on `(record_id, record_type)`. Duplicates can still arise because `setupSnapshotForPull` runs several snapshots into one table: a full (`-1`) snapshot for newly marked patients (`CentralSyncManager.js:~578-590`), the regular incremental one (`:~600`), and an optional full resync of named tables (`:~612`). A record in two of them appears twice (inference from reading the three calls). The dedupe also applies to a central persist if a push repeated a record.
Notes: `idToIncomingRecord` keeps the last copy (`saveIncomingChanges.ts:57-59`) but updates are not de-duplicated: a record present twice and existing is written twice through the concurrent pool (inference, low impact because the copies are normally identical).

### PSH-30 Hooks are off for all persists
Source: Part 1 02:02:19
Verdict: confirmed
Evidence: `saveChanges.ts:1-12` header comment ("`hooks: false` in all transactions here to avoid triggering side effects that may violate other records in the sync payload"), `:34` and `:80`. PR #9711 "Suppress sequelize hooks when persisting sync data" (git log). Test `saveChangesForModel.test.ts:639-776` asserts no invoice items are generated.
Notes: this is Sequelize ORM hooks only; database triggers still fire (sync tick, changelog, `updated_at_by_field`).

### PSH-31 Field-wise merge keeps the higher tick; record-wise merge is last-sync-wins
Source: Part 1 01:59:01-02:08:10
Verdict: confirmed
Evidence: `mergeRecord.ts` and tests above; the speaker's 10-minute scenario is not covered by a test but follows from `mergeRecord.ts:48-52`. The only record-level tick comparison anywhere is none; see Q4.

### PSH-32 "Trust the resolved central server version" comment on the facility
Source: Part 1 02:04:07, 02:05:13
Verdict: confirmed
Evidence: `saveChanges.ts:60-61`. The "resolution" it refers to is whatever central persisted: last pushed wins (record level) or per-field merge (PAD). There is no later comparison on the facility. Central's resolution is then pulled as the new truth.

### PSH-33 Persist sequence: tick-tock at top, update saved-at tick, tick-tock again, then adjust data
Source: Part 2 01:33:33
Verdict: partly
Evidence: `CentralSyncManager.js:752-793`. The `saved_at_sync_tick` update and the second tick-tock are inside the transaction; `adjustDataPostSyncPush` and `bumpSyncTickForRepull` are after it. The hooks run between the first tick-tock and the save. Full order in Q1.

### PSH-34 Merged records are re-sent via updated_at_by_field_sum in the pre-lookup path
Source: Part 2 01:36:32, 01:39:30
Verdict: confirmed (still present)
Evidence: `central-server/app/sync/CentralSyncManager.js:866-872` stores `updatedAtByFieldSum` on incoming snapshot rows; `snapshotOutgoingChanges.js:62,71-91` and `updateLookupTable.js:60-80` compute the same sum on outgoing rows; `removeEchoedChanges.ts:5-27` deletes an outgoing row only if incoming and outgoing agree on record, `saved_at_sync_tick` and `updated_at_by_field_sum` (`IS NOT DISTINCT FROM`). It is still called from `CentralSyncManager.js:631`.
Notes: see PSH-28 for why it no longer protects anything on the lookup path.

### PSH-35 With the lookup table, repull avoidance is by pushed_by_device_id and may not cover the merge case
Source: Part 2 01:31:47, 01:39:30, 01:44:15
Verdict: confirmed, and the suspicion is right
Evidence: see Q7 for the full trace.

## Open questions answered

### Q1 Exact order of operations in `persistIncomingChanges`
`packages/central-server/app/sync/CentralSyncManager.js:737-807` (called from `completePush`, `:882-894`):

1. (`:738-744`) Count INCOMING snapshot rows, store `beganPersistAt` and `totalPushed` as session debug info. Not transactional.
2. (`:746-748`) Pick models: `getModelsForPush` or the requested `tablesToInclude`.
3. (`:752`) Open one `sequelize.transaction` (default isolation, so Postgres READ COMMITTED; no isolation level is set in `packages/database/src/services/database.js`; inference). CLS carries it to every query inside.
4. (`:755-757`) If not mobile, `pauseAudit`. Reason: a facility has already written its `logs.changes`, which arrive with the records and are inserted explicitly; a mobile device keeps none, so the DB triggers write them.
5. (`:758-763`) Tick-tock; keep only `tock` (call it T). The comment, verbatim: "we tick-tock the global clock to make sure there is a unique tick for these changes / n.b. this used to also be used for concurrency control, but that is now handled by shared advisory locks taken using the current sync tick as the id, which are waited on by an exclusive lock taken prior to starting a snapshot - so this is now purely for saving with a unique tick". From here the current sync tick is T, and every row the transaction writes is stamped T by the trigger.
6. (`:767`) `incomingSyncHook` for every model with one. Reads committed data in a read-only sub-transaction and edits the INCOMING snapshot table only (insert rows, update rows), flagged `requires_repull`.
7. (`:769-771`) `withDeferredSyncSafeguards` around `saveIncomingChanges(..., isCentralServer = true)`: all models in dependency order, creates, updates (with field merge), soft deletes folded in, changelog rows inserted.
8. (`:775-780`) `updateSnapshotRecords` sets `saved_at_sync_tick = T` on all INCOMING snapshot rows. Used by `removeEchoedChanges` (PSH-28).
9. (`:782`) `SyncDeviceTick.create({ deviceId, persistedAtSyncTick: T })`. Written after the saves, inside the transaction, so it commits or rolls back with them (PR #11057). `deviceId` comes from `completePush`.
10. (`:784-787`) Second tick-tock; the result is ignored. Current tick becomes T+2 so later writes cannot share T. The comment says so: records modified by `adjustDataPostSyncPush()` will be picked up for pulling in the same session.
11. Transaction commits. The shared advisory lock on T (taken by the trigger) and the `local_system_facts` row lock are released.
12. (`:790`) `adjustDataPostSyncPush`: per model with the hook, in batches of `sync.adjustDataBatchSize`, given the pushed ids. Outside any transaction; writes land at T+2. Models: `Encounter`, `FacilitySettingMigration`.
13. (`:793`) `bumpSyncTickForRepull` (Q2).
14. (`:796-799`) Set `persistCompletedAt`. The warning comment at `:801-802` says any further DB call must go before this or `checkPushComplete` must change.
15. On any error (`:803-806`), log and `markSessionErrored`. Committed work from step 11 is not undone if steps 12-14 fail; the test `CentralSyncManager.syncDeviceTick.test.js` ("keeps the device tick when a step after the persist commit fails") pins that.

`sync_device_ticks` stores `(persisted_at_sync_tick = T, device_id)`, written after the saves, so every row saved in step 7 has `updated_at_sync_tick = T` and joins to that device.

### Q2 Hooks: which, what, what may be returned, repull, and `bumpSyncTickForRepull`
- Which models: `Patient` and `AppointmentSchedule` (PSH-18, PSH-20, PSH-21).
- Settling the contradiction: hooks DO change data. Part 1 01:43:31 is right; Part 2 00:37:48 and 01:33:33 are wrong. The Patient hook renames two patients' display IDs and the Appointment Schedule hook soft deletes appointments. Mechanism: hooks do not write domain tables; they rewrite the INCOMING snapshot (insert new rows, update existing rows), and `saveIncomingChanges` then writes those as ordinary incoming changes. Test: `setupSnapshotForPull.test.js:1086-1098`.
- What a hook may return: `undefined`, or `{ inserts, updates }` (`types/sync.ts`). `inserts` are new snapshot rows (no id, no saved tick); `updates` are existing snapshot rows (with their snapshot `id`). Both are marked `requiresRepull: true` by the runner, not by the hook.
- `bumpSyncTickForRepull` (`database/src/sync/bumpSyncTickForRepull.ts:21-57`): after commit, finds INCOMING snapshot rows with `requires_repull IS TRUE`, groups by table and runs `UPDATE <table> SET updated_at_sync_tick = 1 WHERE id IN (...)`. The literal `1` is a throwaway: it is not `-1`, so the `set_updated_at_sync_tick` trigger (latest definition migration `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:36-67`) overwrites it with the current tick, T+2. That value is not in `sync_device_ticks`, so the lookup join gives `pushed_by_device_id = NULL`, and the row passes the avoid-repull filter and is sent to the pushing device. The raw UPDATE does not run Sequelize hooks; changelog trigger fires as audit is no longer paused (inference).
- Reaching the device: lookup build reads the bumped base row; the pull snapshot includes it because `pushed_by_device_id` is NULL and the tick is above the device's `since`. Test `setupSnapshotForPull.test.js:1030-1100` shows both patients come back (note: that test's config override leaves `avoidRepull` unset for the lookup build, so it exercises the data round trip but not the attribution filter; inference from `__tests__/utilities.js:163-182` and `updateLookupTable.js:133`).
- The class doc of the function claims it also serves "field-wise merge of patient additional data records" (`bumpSyncTickForRepull.ts:12-15`). No code makes that true; see Q7.

### Q3 `saveIncomingChanges` step by step (shared with facility)
Both servers call it (`CentralSyncManager.js:770` with `isCentralServer = true`; `FacilitySyncManager.js:363` with the default false).
1. `saveIncomingChanges.ts:189` sort models in dependency order.
2. Per model: count rows; batch by id cursor (PSH-24); each batch is extracted for changelog, passed to `saveChangesForModel`, then changelog rows are inserted (`:170-173`).
3. `saveChangesForModel` (`:25-128`):
   - `prepareSanitizeContext(changes, sessionId)` once per batch (`:32`); default does nothing.
   - sanitiser chosen by `isCentralServer` (`:40-42`) then `deletedAt` is dropped (`:40`).
   - `isCentralServer` branches: sanitiser choice (`:40`), restore rule (`:70`, facility only), and `saveUpdates(..., isCentralServer)` which does the merge on central only (`saveChanges.ts:48-61`). Nothing else branches on it.
   - classify as in PSH-27; create then update.
   - `saveCreates`: dedupe, `bulkCreate({ hooks: false })`. `saveUpdates`: on central merge each with the existing row (`mergeRecord`), re-apply the delete/restore decision after the merge (`:56-58`, because `deleted_at` is not tracked in `updated_at_by_field`); then `model.update(values, { where: { id }, fields: all model attributes, paranoid: false, hooks: false })` through `asyncPool(persistUpdateWorkerPoolSize = 5)` with `id` stripped (generated `id` columns reject it, `:71-79`) and writes limited to model attributes (`:63-69`).
- `hooks: false`: PSH-30.
- Linked discussion at the comment `saveIncomingChanges.ts:55-56` (`https://github.com/beyondessential/tamanu/pull/4854#discussion_r1403828225`; fetched with `gh api`): a reviewer asked why records are filtered on `data.id` when building the id-to-incoming map; the author replied that it is copied from the earlier `changes.filter(c => c.data.id)` line, that they did not know why the id check was there, and that they were wary of changing it ("I want to break things by changing it"); the reviewer agreed it was strange, said staying safe was reasonable, and asked for a comment linking the discussion. Nothing was decided beyond keeping the filter; the cause is unrecorded (the transcript's "Chesterton's fence").

### Q4 Record-level conflict: who wins, and is any `updated_at_sync_tick` compared at record level?
- Central, record level: the incoming (last to sync) record wins. Path: `saveChangesForModel` classifies existing rows as updates (`saveIncomingChanges.ts:64-68`), `saveUpdates` calls `mergeRecord(existing, incomingFields)` (`saveChanges.ts:57`), which returns `incoming` unless both carry `updatedAtByField` (`mergeRecord.ts:48-52`), then `model.update` writes it (`saveChanges.ts:80`). The incoming data has no `updatedAtSyncTick` (stripped from snapshot data by `COLUMNS_EXCLUDED_FROM_SYNC`, `sync/constants.ts:6-11`), so there is nothing to compare even in principle.
- Is there ANY record-level tick comparison anywhere? Not in the persist path. `pickLatest` is called only from `lastWriteWinsPerField` (`mergeRecord.ts:25`) and is not exported. The only other comparisons of `updated_at_sync_tick` in the persist/pull path are not conflict resolution: the facility's abort check against its last push tick (PSH-10), and the pull filters (`> :since`). The speaker's conclusion is confirmed.
- Tests: `database/__tests__/sync/mergeRecord.test.ts:19-26` ("uses the entire incoming record ... ignoring the fact the existing record has the higher sync tick"), `:27-34`, and two tests where only one side has field info (`:36-62`).
- Facility pulling: always takes central's version (`saveChanges.ts:60-61`), the update is a straight overwrite by id and the stored tick becomes `-999` (`pullIncomingChanges.js:56,96`; tests `saveChangesForModel.test.ts:518-600`). The one guard is the abort in PSH-10, which restarts the sync rather than choosing.
- Why it works: the facility's local write after its push snapshot is detected by the abort and pushed in the next session (Q6, #11269); within one push the later session simply overwrites.

### Q5 Field-level merge
- Opt-in: a model carries an `updatedAtByField` attribute (`JSON` column) on both sides of the push. Strategy is chosen by data presence (`mergeRecord.ts:48-52`), not a model flag. `lastWriteWinsPerField` takes both records, builds the superset of keys (`:20`), and for each key except `updatedAtByField` and `updatedAtSyncTick` picks the value with the greater per-field tick (`:22-33`); ties and missing ticks (default 0) keep the existing value. Merged `updatedAtByField` is rebuilt with the winning ticks (`:34`). Keys with no tracked tick (for example `id`, `createdAt`) end up recorded with tick 0 (inference from `:25-32`). `merged.updatedAtSyncTick` is set to the max of the two (`:37-42`) but the trigger overwrites it on write.
- Which models: only `patient_additional_data`. Checked: `updated_at_by_field` columns in the baseline and every later migration; models with an `updatedAtByField` attribute; settings (`Setting` is `PULL_FROM_CENTRAL` and has none).
- Maintenance, server side: DB trigger, not application code. `public.set_updated_at_by_field()` (`000_baseline.sql:1113-1164`; no later migration redefines it), attached as `set_patient_additional_data_updated_at_by_field BEFORE INSERT OR UPDATE` (`:11454`). On INSERT: if `updated_at_by_field` is already set it is kept (explicit value, e.g. from a merge or a push); otherwise every non-null column except `id`, `created_at`, `updated_at`, `deleted_at`, `updated_at_sync_tick`, `updated_at_by_field` gets the current tick. On UPDATE: if the new `updated_at_by_field` differs textually from the old, it is kept; otherwise the columns that changed get the current tick on top of the old map.
- Maintenance, mobile: application code in `mobile/App/models/PatientAdditionalData.ts:195-225`, with the same keep-if-explicit rule.
- Which tick: the device's current sync tick at edit time (facility: session tick set in `FacilitySyncManager.js:292`; central: its current tick; mobile: its session tick). Field ticks are therefore comparable across devices only as coarsely as session ticks are (PSH-05).
- Edge worth knowing: `merged.updatedAtSyncTick` is `Math.max(existing || -1, incoming || -1)`; if that came out as `-1` the trigger would store `-999` (never pulled). On central the existing row always has a real tick, so it does not occur in practice (inference).

### Q6 Soft delete and restore rules, PR #11055 and #11269
- Rules (code): delete decision from either side, restore only on a facility, no restore from central, delete wins over merge on central, client `deletedAt` ignored. Details in PSH-27 and PSH-28. Tests: `saveChangesForModel.test.ts:179-516` including "does not restore a centrally deleted field-merged record from a stale mobile edit" (`:347`) and "should NOT restore records in central server, however they should still be updated" (`:257`).
- PR #11055 "TAM-7120: don't re-push soft-deletes or restores": facility saves pulled deletes/restores with `destroy()`/`restore()`, which left `updated_at_sync_tick` out of the statement, so the trigger stamped the current tick and the facility pushed central's own delete back (a ~800k-row case). Fix: write `deleted_at` and the tick in the same INSERT/UPDATE (pulled records carry `-1`, stored as `-999`; on central incoming rows carry no tick, so the trigger stamps the current one). Knock-on: client `deletedAt` is discarded on central, so a mobile delete takes central's timestamp; `resolveAppointmentSchedules` uses a model query; `saveUpdates` restricts writes to model attributes.
- PR #11269 "TAM-7120: collision when central deletes but facility updates" (body empty; diff from `git show af1bdf0304`): a one-line change to `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js` removing `AND is_deleted IS FALSE`. A pulled delete is now checked too: if the facility edited that record after its push snapshot, the sync aborts and restarts so the edit is pushed first. Reason (code comment): a pulled delete is persisted with the not-to-push sentinel, so the overwritten local edit and its changelog would never reach central.

### Q7 The open question: field-merged PAD row and the pushing device
Plain verdict: BROKEN (with default settings). The merged row is not sent back to the device that pushed it. It is not caught by `bumpSyncTickForRepull`, `adjustDataPostSyncPush` or `removeEchoedChanges`, and no test covers it.

Trace, for a PAD the pushing device A edited while another device B had pushed a different field earlier:
1. A's push reaches central; INCOMING snapshot row for the PAD, with `updated_at_by_field_sum` computed from A's map (`CentralSyncManager.js:866-872`).
2. `persistIncomingChanges` tick-tocks; current tick = T (`:763`). No incoming hook exists for PAD (hooks only on `Patient` and `AppointmentSchedule`), so nothing is flagged `requires_repull`.
3. `saveUpdates` on central merges existing (B's field, higher tick) with A's row field by field (`mergeRecord.ts:19-44`), then `model.update` writes the merged row. The trigger `set_updated_at_by_field` keeps the merged map (it differs from the old); `set_updated_at_sync_tick` stamps the current tick T regardless of the value passed (it only special-cases `-1`; `1793235590139-...:51-64`). So the merged row's `updated_at_sync_tick` = T. Test `saveChangesForModel.test.ts:290-341` asserts exactly this (`deleted.updatedAtSyncTick` equals the current tick after a merged update).
4. `SyncDeviceTick.create({ deviceId: A, persistedAtSyncTick: T })` (`:782`). It is the same `tock` as step 2. So `sync_device_ticks.persisted_at_sync_tick` (T) equals the merged row's `updated_at_sync_tick` (T): they match. `CentralSyncManager.syncDeviceTick.test.js` ("correctly sets the sync device tick") asserts this identity for a pushed patient.
5. The second tick-tock moves to T+2 (`:787`). No later step touches the PAD: `adjustDataPostSyncPush` runs only for `Encounter` and `FacilitySettingMigration`; `bumpSyncTickForRepull` only touches rows with `requires_repull` (none).
6. Lookup build: `buildSyncLookupSelect` selects `sync_device_ticks.device_id` as `pushed_by_device_id`, joined on `persisted_at_sync_tick = <table>.updated_at_sync_tick` when `avoidRepull` is on (`updateLookupTable.js:82-86`; PAD uses `buildPatientLinkedLookupFilter`, which adds nothing merge-specific: `sync/buildPatientLinkedLookupFilter.ts`). T matches, so `pushed_by_device_id = A`.
7. A's pull snapshot excludes rows `pushed_by_device_id <> :deviceId OR IS NULL` (`snapshotOutgoingChanges.js:297-299`), so the merged row is excluded for A. Other devices pull it normally.
8. The pre-lookup safeguard `removeEchoedChanges` (which used `updated_at_by_field_sum` to keep merged rows) cannot help: it never sees the row for A, and when `avoidRepull` is off it only deletes outgoing rows whose `saved_at_sync_tick` equals the incoming one (T), but incrementally built lookup rows carry the lookup's own tick (pending flag, then `lookupEndTick`, `CentralSyncManager.js:357-366`, `updateLookupTable.js:495-500`), not T, so the equality essentially never holds (inference). Test coverage of `avoidRepull` (`CentralSyncManager.syncLookup.test.js:1496-1600`) uses a plain Patient, not a merge.

Consequence: A keeps its pre-merge PAD (without B's field) until some other write changes the row's tick again; central and A disagree meanwhile. Fix options (inference, not read from code): flag merged PAD rows `requires_repull` (for example a PAD `incomingSyncHook` or a `bumpSyncTickForRepull` input from the merge), or write the merged row after the second tick-tock.

### Q8 Model sanitisation (every function found)
Defaults: `Model.prepareSanitizeContext`, `sanitizeForCentralServer`, `sanitizeForFacilityServer` are identity (`models/Model.ts:199-215`).
- `Attachment.sanitizeForCentralServer` (`models/Attachment.ts:38`) via `sanitizeForDatabase` (`:28-33`): base64 `data` to Buffer. Attachments do not sync to facilities (comment `:35-37`), so no facility variant. `sanitizeForDatabase` is also used by routes and FHIR.
- `Asset.sanitizeForCentralServer` (`models/Asset.ts:40`): only used when an asset is inserted by hand via the rest client (asset is pull-from-central); hex string `\x...` to Buffer, any other string as base64, otherwise `Buffer.from`.
- `Asset.sanitizeForFacilityServer` (`:54`): hex string to Buffer, else `Buffer.from(data)`.
- `PatientCommunication.sanitizeForCentralServer` (`models/PatientCommunication.ts:73`): drops any pushed `attachment`; an email-channel destination that is not a single email address is stored as `BAD_FORMAT` with error "Invalid destination address". Spec: `specs/sync/pushed-records.md`.
- `ReportRequest.prepareSanitizeContext` (`models/ReportRequest.ts:153`) and `sanitizeForCentralServer` (`:212`): resolves once per batch whether each requesting user may run their report and can use a facility of the pushing session; rebuilds recipients as `{ email: [...] }`; otherwise stores `ERROR` with "Invalid recipients" or "Requesting user cannot run this report" so it is never run (from PR #11730 "validate external-effect sync pushes").
- `ReferenceDrugFacility.prepareSanitizeContext` (`models/ReferenceDrugFacility.ts:74`) and `sanitizeForFacilityServer` (`:89`): when the facility's `integrations.mSupplyMed.stockOnHandEnabled` setting is on, strips `quantity` and `stockStatus` from pulled records so central's copy never overwrites mSupply's stock on hand.
- `saveChangesForModel` itself always removes `deletedAt` after sanitising (`saveIncomingChanges.ts:40`).
Not found in `packages/` apart from mobile (mobile has its own sync code, not read).

## Not in the transcript

- **Row lock held by the tick-tock** (inference): the persist transaction updates `local_system_facts.currentSyncTick` twice and holds that row until commit, so other sessions' tick-tocks wait for persists. `CentralSyncManager.js:166-168` comment shows this is known.
- **`bumpSyncTickForRepull` runs after commit**, with a dummy tick `1` rewritten by the trigger. If the server dies between commit and bump, the repull is lost because the flag lives only in the temporary snapshot table (inference). `persistCompletedAt` is unset then, so the session reports an error (`:903-910`).
- **Hook queries only see committed data** and execute before any save, so a hook cannot see the push it belongs to except via the snapshot rows it is given.
- **Audit and hooks**: records changed only by a hook have no pushed changelog (PSH-15 note).
- **Models not in `modelsToInclude`** (`tablesToInclude` set) would have hook-inserted rows never saved (inference; hook models are iterated from the same list but inserted rows for other tables are not filtered).
- **Facility pull sets `pauseAudit` only when `totalPulled > 0`** and records `LAST_SUCCESSFUL_SYNC_PULL` in the same transaction (`FacilitySyncManager.js:357-372`).
- **Self-referencing FKs and unique constraints are deferred only during the save**; central still runs the hook phase outside deferral.
- **`persistedCacheBatchSize`, `incomingSyncHookBatchSize`, `adjustDataBatchSize`, `persistUpdateWorkerPoolSize`, `pauseBetweenPersistedCacheBatchesInMilliseconds`** in `packages/central-server/config/default.json5:47-52` change persist behaviour. `sync.lookupTable.avoidRepull` (`:61`, default true) changes who gets what back (Q7).
- **`avoidRepull` is read from two places**: the lookup build uses the manager's config (`updateLookupTable.js:133`), the pull snapshot uses the real config unless overridden (`snapshotOutgoingChanges.js:231`), so tests that override only one side can produce inconsistent attribution (`CentralSyncManager.setupSnapshotForPull.test.js:1030-1100`, inference).
- **`addIncomingChanges`** rejects pushes for unknown models or models that are not pushable and errors the session (`CentralSyncManager.js:810-880`).
- **`sync_device_ticks` primary key** means a tick can belong to only one device; the uniqueness of tocks is therefore load-bearing.

## Unresolved

- Whether Sequelize's nested `transaction()` inside the CLS persist transaction really uses a separate connection for hook reads (PSH-19). Check Sequelize 6 CLS source or test with `pg_stat_activity`.
- How mobile converts its string `updatedAtByField` to an object before pushing, and whether mobile-pushed PAD merges behave (`mobile/App/models/PatientAdditionalData.ts:180`, `services/sync/utils/snapshotOutgoingChanges.spec.ts:60` expects an object). Not read.
- Whether the missed return of a merged PAD to its pusher has been seen in production or filed; a repro would be a two-facility push test using `PatientAdditionalData` through `CentralSyncManager` with `avoidRepull: true` in both config sides.
- Why the `c.data.id` filter exists (PR #4854 discussion records only that nobody knew).
- Whether the removed `removeEchoedChanges` could be deleted; confirming my reading that it cannot match lookup rows needs a test that sets `avoidRepull: false` and pushes then pulls.
