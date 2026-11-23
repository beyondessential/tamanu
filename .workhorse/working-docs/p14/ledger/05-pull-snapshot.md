# Pull phase on central: initiatePull, setupSnapshotForPull, snapshot passes, lookup reads

Area prefix `PLL`. Code is the worktree at main `22d3edaa36`. Transcript ranges: Part 1 00:38:02 to 00:45:36 and Part 2 00:16:55 to 01:14:50 (plus context either side). All paths are relative to the repository root. `CSM` below means `packages/central-server/app/sync/CentralSyncManager.js`; `SOC` means `packages/central-server/app/sync/snapshotOutgoingChanges.js`.

## Drift

- PLL-12 wrong: the facility does not send `tablesToInclude` or `tablesForFullResync`. Only mobile does. The facility sends `since`, `facilityIds`, `deviceId`.
- PLL-18 partly: the lookup tick range comes from `sync_lookup_ticks`, but `maxSourceTick` is the last row's `lookupEndTick`, not a source tick, and the bounds are strict. The range is computed once from the incremental `since` and reused for every pass.
- PLL-22 partly: the marked-for-sync tables are real tables, but in schema `sync_snapshots`, not `public`. There are two (full and regular), named `<sessionId>_full_sync_marked_for_sync_patients` and `<sessionId>_regular_sync_marked_for_sync_patients`.
- PLL-26/PLL-27 partly: the timeout exists but defaults to off, and the timer callback throws outside any `try`, so it does not abort the transaction the way the speaker implies (see the entry).
- PLL-30 wrong in detail: `until` is not set on entering the repeatable read transaction. `pullUntil` is the tick from the first tick-tock, the same tick passed to the pending-edits wait, and the same tick returned to the client. The snapshot queries have no upper bound at all, so the speaker's conclusion (data beyond that tick can be sent and is re-sent next time) is right but the "two different ticks" contrast is not.
- PLL-33 partly: incoming sync hooks can change records. They are marked `requires_repull` and bumped to a new tick so they are deliberately re-pulled.
- PLL-34 partly: in steady state `removeEchoedChanges` essentially cannot match on the lookup path. The reason is stronger than the speaker's (see the entry): lookup ticks and persist ticks come from different halves of the tick-tock and can never be equal.
- PLL-39 partly: the lookup flag is config (`sync.lookupTable.enabled`), default true, and the old path is reachable only by setting it false. The test config sets it false, so most central tests run the old path.
- PLL-48 partly: the model-level note filter adds all lab-request notes when `syncAllLabRequests` is on, the opposite of what was said. On the production (lookup) path the speaker's claim holds, because notes never carry `is_lab_request`. The two paths disagree.
- PLL-51 wrong: "all record types are for patients" is not a cold path. It is the normal case for the full pass on every pull, and it exists for performance (PR #6506).
- PLL-08 partly: `sync_lookup.data` is `json`, not `jsonb`.
- Streaming pull (PLL-15): the `/pull/stream` route passes a numeric snapshot id as the cursor where `getOutgoingChanges` expects a base64 cursor. From reading the code, the second batch would throw. Streaming is off by default.

## Claims

### PLL-01 Pushed data is written with a tick the facility is already beyond; central-changed data gets a later tick
Source: Part 1 00:38:02
Verdict: confirmed
Evidence: `CSM:763` persist takes `tock`; `CSM:775-780` stamps incoming snapshot rows with `savedAtSyncTick: tock`; `CSM:787` tick-tocks again so later central edits (e.g. `adjustDataPostSyncPush`) get a different tick. The same session's pull then gets `pullUntil` from a tick-tock taken later (`CSM:467`), so the facility's next cursor is above the persist tock.
Why: code comment at `CSM:783-786` ("so that if records are modified by adjustDataPostSyncPush(), they will be picked up for pulling in the same session").
Notes: on the lookup path a pushed record is additionally excluded by pushing device (PLL-56), so the "tick is already beyond" argument is no longer what stops the echo in the same session.

### PLL-02 Pull runs two snapshots: newly marked patients in full, then incremental
Source: Part 1 00:39:21
Verdict: confirmed (there is a third, optional pass)
Evidence: `CSM:579-592` full pass (`since` fixed at -1, `fullSyncPatientsTable`, count `newPatientFacilitiesCount`); `CSM:601-611` incremental pass (`since`, `incrementalSyncPatientsTable`, `patientFacilitiesCount`); `CSM:615-628` optional third pass for `tablesForFullResync`.
Why: n/a.
Notes: the third pass is mobile only (PLL-12).

### PLL-03 Central works out "newly marked" patients from `patient_facilities` ticks newer than the facility's last sync
Source: Part 1 00:39:21
Verdict: confirmed
Evidence: `packages/central-server/app/sync/createMarkedForSyncPatientsTable.js:14-22`: full table selects `patient_id` from `patient_facilities` where `facility_id IN (:facilityIds) AND updated_at_sync_tick > :since`; the regular table is the complement, `updated_at_sync_tick <= :since`. Called at `CSM:503-517` (full first, then regular). `CSM:495-497` separately counts `patient_facilities` rows with `updatedAtSyncTick > since`.
Why: comments at `createMarkedForSyncPatientsTable.js:20-21`.
Notes: the test is on the row's tick, not on row creation. Any later update to a `patient_facilities` row that bumps its tick makes the patient "new" again and triggers another full pull for them (inference from the predicate; no test read). For a first sync `since` is -1, so every marked patient is "new".

### PLL-04 Both passes call the same snapshot code with a different patients table and write to the same snapshot table; the second pass is "all records for all patients ever marked"
Source: Part 1 00:40:30
Verdict: partly
Evidence: both passes call `snapshotOutgoingChanges` (`CSM:580`, `CSM:601`), which inserts into `sync_snapshots."<sessionId>"` (`SOC:229`, `SOC:238`). The incremental pass carries only records with `updated_at_sync_tick > since` for previously marked patients (`SOC:259`), plus all non-patient records changed since.
Why: n/a.
Notes: the speaker's own tail ("since it most recently synced") is the accurate reading. The full-history load is only the first pass. The full pass uses only patient-linked models (`getPatientLinkedModels(modelsToInclude)`, `CSM:582`) and a session config reduced to `{ sensitiveNetworkId }` (`CSM:589-591`), so `syncAllLabRequests` never applies to it.

### PLL-05 Dynamic page size in push and pull; duration is configurable
Source: Part 1 00:41:35
Verdict: confirmed (facility side)
Evidence: `packages/facility-server/app/sync/calculatePageLimit.js:5-40` scales the next limit by `optimalTimePerPageMs / durationPerRecord`, clamped to `minLimit`/`maxLimit` and to a maximum change of `maxLimitChangePerPage` per page. Used in the polling pull at `packages/facility-server/app/sync/pullIncomingChanges.js:26,72`. Config at `packages/facility-server/config/default.json5:36-42` (`optimalTimePerPageMs` 2000, `initialLimit` 10, `maxLimitChangePerPage` 0.2).
Why: n/a.
Notes: the streaming pull does not use it; the server pages by `sync.databasePollBatchSize` (default 100, `packages/settings/src/schema/central.ts:240-245`). The default page size when the client sends no limit is 100 (`buildSyncRoutes.js:290-300`). I did not check the push side.

### PLL-06 Facility writes pulled records to a temporary table, not directly to its tables
Source: Part 1 00:41:35, 00:43:28
Verdict: confirmed (not a temp table)
Evidence: `pullIncomingChanges.js:50-70` inserts pulled records via `insertSnapshotRecords` into the facility's `sync_snapshots."<sessionId>"` table, created at `packages/facility-server/app/sync/FacilitySyncManager.js:341` (`createSnapshotTable`). The facility then saves in one transaction (`FacilitySyncManager.js:359-373`). Pulled rows are marked `updatedAtSyncTick: INCOMING_FROM_CENTRAL_SERVER` (`pullIncomingChanges.js:56`) so they are not pushed back.
Why: comment at `pullIncomingChanges.js:61-65` (avoid holding the whole pull in memory).
Notes: dropped in the `finally` at `FacilitySyncManager.js:231-238`.

### PLL-07 Pull relies on push having succeeded; push can succeed without pull; atomicity is per phase
Source: Part 1 00:43:28, 00:44:31
Verdict: confirmed
Evidence: `FacilitySyncManager.js:225-226` awaits `pushChanges` then `pullChanges` in sequence, so a push failure skips the pull. `pushChanges` writes `FACT_LAST_SUCCESSFUL_SYNC_PUSH` (`FacilitySyncManager.js:324`) before the pull begins. The pull cursor is a separate fact written only in the pull's save transaction (`FacilitySyncManager.js:371`).
Why: n/a.
Notes: the session is marked errored on a local failure (`FacilitySyncManager.js:227-231`), but the push cursor is already committed.

### PLL-08 Lookup table is a cache of records: JSONB copy, the sync tick, a patient column, record id, record type, one table for all models
Source: Part 1 00:45:36, 00:47:45
Verdict: partly
Evidence: `packages/database/src/models/SyncLookup.ts:11-29` columns: `record_id`, `record_type`, `data`, `updated_at_sync_tick`, `patient_id`, `encounter_id`, `facility_id`, `sensitive_network_id`, `is_lab_request`, `is_deleted`, `updated_at_by_field_sum`, `pushed_by_device_id`, `needs_rebuild`. `data` is `json`, not `jsonb` (`SyncLookup.ts:29`; `packages/database/src/migrations/000_baseline.sql:3979-3991`). The refresher runs on a schedule of `*/20 * * * * *` (`packages/central-server/config/default.json5:263-266`), matching the "20 seconds".
Why: n/a.
Notes: the table is one for all models (`record_type` discriminates). Population is another area's ledger.

### PLL-09 Each table decides for itself whether a record goes to a facility; notes are the most complex
Source: Part 1 00:45:36, 00:46:44
Verdict: confirmed
Evidence: `packages/database/src/sync/buildNoteLinkedSyncFilter.ts:69-116` is the longest filter: it joins every note record type and ORs the patient, encounter-via-triage/lab/imaging, and other patient-direct cases. Volume claims ("biggest table") are not checkable in code.
Why: n/a.
Notes: see PLL-48.

### PLL-10 Some tables sync everywhere (no patient id), some are facility-scoped without a patient
Source: Part 1 00:50:00
Verdict: confirmed
Evidence: `packages/database/src/models/PatientFacility.ts:58-67` (facility-scoped), `packages/database/src/models/Setting.ts:246` and `Setting.ts:249-257` (facility scope, central-scope rows filtered out), `ReferenceDrugFacility.ts:71`, `LocationAssignment*.ts`. Everywhere tables return null (`Facility.ts:115`, `ReferenceData.ts:214`).
Why: n/a.
Notes: on the lookup path the unscoped test is the `facility_id`/`sensitive_network_id` clause (PLL-52).

### PLL-12 Facility POSTs initiate-pull saying which facility ids, which tables to include, which tables need full resync
Source: Part 2 00:16:55
Verdict: wrong for the facility, right for mobile
Evidence: facility body is `{ since, facilityIds, deviceId }` (`packages/facility-server/app/sync/CentralServerConnection.js:194-199`). Mobile sends `tablesToInclude` and `tablesForFullResync` too (`packages/mobile/App/services/sync/CentralServerConnection.ts:270-284`), the latter from a local fact deleted after a successful pull (`MobileSyncManager.ts:390-406`, `:543-548`). The route destructures all four (`packages/central-server/app/sync/buildSyncRoutes.js:221-236`) and takes `deviceId` from `req.device.id`, ignoring the body's `deviceId`. `since` must parse as a number or the route throws (`buildSyncRoutes.js:224-228`).
Why: n/a.
Notes: without `tablesToInclude`, `modelsToInclude` is every model (`CSM:489-491`).

### PLL-13 One request carries both the incremental set and the full-resync set
Source: Part 2 00:18:09
Verdict: confirmed
Evidence: `CSM:306-323` and `CSM:601-628`: a single `setupSnapshotForPull` runs the incremental pass and, if `tablesForFullResync` is set, a third pass from -1 for those tables.
Why: n/a.
Notes: the third pass reuses `incrementalSyncPatientsTable` and `sessionConfig`, and uses `getModelsForPull(filterModelsFromName(...))`, so it includes non-patient tables.

### PLL-14 initiatePull marks the session processing under an advisory lock, runs setup without awaiting, endpoint returns early, facility polls `pull/ready` (or stream)
Source: Part 2 00:18:09
Verdict: confirmed
Evidence: `CSM:306-323`: `connectToSession`, a refusal if already processing (`CSM:312-315`), `markSessionAsProcessing` (`CSM:317`), then `this.setupSnapshotForPull(...)` not awaited (`CSM:318`). The lock is `pg_advisory_xact_lock` held by an open transaction that is committed in `unmarkSessionAsProcessing` (`CSM:277-293`), released in the `finally` at `CSM:647-650`. Readiness: `checkPullReady` (`CSM:673-693`) returns false while the lock is held, errors the session if not processing but `snapshotCompletedAt` is null. Routes: `buildSyncRoutes.js:243-285`. Client polls or streams at `CentralServerConnection.js:194-225`.
Why: comments at `CSM:277-283` (readable across cluster processes and auto-released on restart).
Notes: any error inside `setupSnapshotForPull` is caught and recorded with `markSessionErrored` (`CSM:641-646`), not thrown to the client request.

### PLL-15 Streaming variant of pull
Source: Part 2 00:19:34
Verdict: partly (the speaker had no working knowledge; behaviour below)
Evidence: enabled only by the central setting `sync.streaming.enabled` (default false, `packages/settings/src/schema/central.ts:232-239`), read by the facility from login data (`CentralServerConnection.js:125-127`). It changes how the client waits (`pull/ready/stream` writes keep-alive messages every `databasePollInterval`, default 1000 ms, `buildSyncRoutes.js:254-277`) and how it receives data (`pull/stream`, `buildSyncRoutes.js:306-343`, loops `getOutgoingChanges` in batches of `databasePollBatchSize` until empty and writes each record as a message). The facility writes in batches while still reading (`pullIncomingChanges.js:79-144`).
Why: n/a.
Notes: likely bug, by reading only (not run): `buildSyncRoutes.js:319` starts `startId` at 0 and `:331` sets it to `changes[last].id`, a numeric snapshot row id. `getOutgoingChanges` hands it as `fromId` to `findSyncSnapshotRecordsOrderByDependency`, which does `JSON.parse(atob(fromId))` on any truthy value (`packages/database/src/sync/findSyncSnapshotRecords.ts:69`). The polling client sends a base64 `{sortOrder,id}` cursor (`pullIncomingChanges.js:45-46`), so the stream route's numeric cursor would fail on the second iteration. The facility's resume path also sends a numeric id (`pullIncomingChanges.js:126,110-113`). I confirmed with Node that `atob` on a short number string either throws or yields non-JSON. Both pieces came in with PR #7983 (`git log -S'atob(fromId)'` and `-S'startId = changes'`). No test references `pull/stream`.

### PLL-17 Tick-tock gives a new tick; the snapshot is considered to run from `since` to that tick
Source: Part 2 00:21:12
Verdict: partly
Evidence: `CSM:467` takes `{ tick }`; `CSM:477-480` stores `pullSince: since, pullUntil: tick` on the session. The snapshot queries then filter only on `updated_at_sync_tick > :since` (`SOC:94`, `SOC:259`) and the marked tables on `> :since` / `<= :since`. Nothing bounds the upper end at `pullUntil`. See PLL-30.
Why: comment at `CSM:464-466` (the "tick" half of the tick-tock means later changes have a later tick).
Notes: `tickTockGlobalClock` adds 2 to the clock and returns `{ tick: tock - 1, tock }` (`CSM:127-134`); the comment at `CSM:128-131` gives the reason (central-side edits, e.g. imports, stamp the tock so a client sitting at the tick does not miss them).

### PLL-18 `getLookupSourceTickRange` reads `sync_lookup_ticks` to map lookup ticks to source ticks
Source: Part 2 00:21:12, 00:22:50
Verdict: partly
Evidence: `packages/central-server/app/sync/getLookupSourceTickRange.js:13-41`. It selects `sync_lookup_ticks` rows with `lookupEndTick` strictly between `since` and `tick` (`Op.gt`/`Op.lt`), takes the first ordered ascending and reads its `sourceStartTick` as `minSourceTick`, then the last ordered descending and reads its `lookupEndTick` as `maxSourceTick`. Returns `{}` if no rows. Rows are written by the lookup build: `sourceStartTick` is the previous build's up-to tick and `lookupEndTick` is the tick the build stamps on its rows (`CSM:343-370`). Primary key is `lookup_end_tick` (`packages/database/src/models/SyncLookupTick.ts:23-33`).
Why: comment at `getLookupSourceTickRange.js:3-11`.
Notes: `maxSourceTick` is a lookup end tick, so it is at or above the source ticks it covers (a slightly wide upper bound, inference). The strict `< pullUntil` means a lookup row stamped exactly at `tick` is not in the range. Both bounds are computed once at `CSM:471` using the incremental `since` and stored as session parameters (`CSM:482-487`), so the full-history pass for newly marked patients attaches changelog only from that range (consistent with `specs/audit/changelog.md:56-57`: records arrive carrying entries since the peer last synced them). The consumer treats a falsy `minSourceTick` or `maxSourceTick` as "no range" (`CSM:726`), so a genuine 0 would drop changelog attachment (minor, inference).

### PLL-19 Changelog rows are found by tick range instead of populating the lookup table with changelog rows; PR fix to load only the ends
Source: Part 2 00:22:50, 00:23:56, 00:24:58
Verdict: confirmed
Evidence: range fix is PR #11532 (merged 2026-10-29, `git log` on `getLookupSourceTickRange.js`): initial sync pulls from -1, so the old code loaded every `sync_lookup_ticks` row (one per lookup update, never pruned) as model instances only to read the first and last; ~600k rows against a 512 MB heap crashed central. Current code runs two `findOne` queries ordered on the primary key (`getLookupSourceTickRange.js:22-35`). Earlier: PR #7562 introduced the approach, PR #7665 made the range be calculated once per session. The attachment itself is PLL-63.
Why: PR #11532 body; comment at `getLookupSourceTickRange.js:9-11`.
Notes: the transcript's "populate the lookup table with changelog rows first" history is not checkable in code.

### PLL-20 Debug info on the sync session, then the new-patient-facilities count
Source: Part 2 00:24:58
Verdict: partly
Evidence: what is written is functional, not just debug: `pullSince`/`pullUntil` columns (`CSM:477-480`) and `parameters` (`minSourceTick`, `maxSourceTick`, `tablesForFullResync`, `useSyncLookup`; `CSM:482-487`). `SyncSession.setParameters` merges JSON into `parameters` (`packages/database/src/models/SyncSession.ts:55-64`). `useSyncLookup` is write-only: nothing reads it (grep over non-test code).
Why: n/a.
Notes: `pullUntil` is what the client later receives (PLL-30).

### PLL-22 Marked-for-sync patients tables: deterministic name, not temporary, in the public schema
Source: Part 2 00:25:56
Verdict: partly
Evidence: `packages/database/src/sync/manageSnapshotTable.ts:6,24-30`: schema is `sync_snapshots`, names `"sync_snapshots"."<sessionId>_full_sync_marked_for_sync_patients"` and `..._regular_sync_marked_for_sync_patients`. Created with plain `CREATE TABLE ... AS SELECT` (`createMarkedForSyncPatientsTable.js:14-23`), no `TEMP`, no index, outside the repeatable read transaction (before `CSM:571`). The session id is checked against `^[A-Za-z0-9-]+$` before use in SQL (`manageSnapshotTable.ts:8-15`). Dropped on a clean session end by `completeSyncSession` (`packages/database/src/sync/completeSyncSession.ts:15-17`); an errored session keeps them until `SnapshotTableCleaner` drops them after `retentionHours` (`packages/central-server/app/tasks/SnapshotTableCleaner.js:30-75`, `config/default.json5:258-262`, 24 h).
Why: n/a.
Notes: because the name is deterministic and the create is not `IF NOT EXISTS`, re-running setup for the same session would fail on "already exists" (inference). The facility server wipes the whole schema at start (`dropAllSnapshotTables`, `FacilitySyncManager.js:217`); central never does.

### PLL-23 If any facility served has sync-all-lab-requests set, all lab requests (and what they rely on) are taken
Source: Part 2 00:25:56, 00:27:37
Verdict: confirmed, with conditions not mentioned
Evidence: `CSM:519-535` reads the raw `settings` table: key `sync.syncAllLabRequests`, scope `facility`, `facility_id IN (:facilityIds)`, `value = 'true'`. It is true if any facility in the session has it. `CSM:559-564` then ANDs it with `!session.parameters.isMobile && since > -1`.
Why: comment at `CSM:560-561` ("no need for historical ones on initial sync, and no need on mobile").
Notes: see PLL-26a for everything it changes. Possible bug, by reading only: the query does not filter `deleted_at IS NULL`, but settings rows are soft-deleted when a settings tree is saved without the key (`packages/database/src/models/Setting.ts:219-235`), so a removed `true` row could keep the flag on (not tested here).

### PLL-24 "Sync all vaccines with these IDs" existed in the old sync and was dropped
Source: Part 2 00:27:37, 00:28:56, 00:29:57
Verdict: confirmed (absence)
Evidence: no code path or setting for it in `packages/` (grep for sync-all-vaccine style names finds nothing). `SessionConfig` has only `syncAllLabRequests` and `sensitiveNetworkId` (`packages/database/src/types/sync.ts:9`, `CSM:559-564`).
Why: the reasons given are not in code.
Notes: n/a.

### PLL-25 The only special sync flag is sync-all-lab-requests, implemented as an `is_lab_request` column
Source: Part 2 00:29:57
Verdict: partly
Evidence: besides the lab flag, session config also carries `sensitiveNetworkId` (`CSM:537-564`), which narrows or widens what a session receives. The `is_lab_request` column is set by the lookup builders for `LabRequest`, `LabTest`, `LabTestPanelRequest`, `LabRequestAttachment`, `LabRequestLog` (`isLabRequestValue: 'TRUE'`) and for `Encounter` when a lab request was recently attached (`packages/database/src/models/Encounter.ts:416-419`). Notes are not flagged.
Why: n/a.
Notes: see PLL-26a.

### PLL-26 Snapshot runs in a repeatable read transaction so concurrent changes are excluded; snapshot written to a table
Source: Part 2 00:31:19
Verdict: confirmed
Evidence: `CSM:571` `repeatableReadTransaction` (`packages/database/src/sync/transactions.ts:16-26`, issues `SELECT 1` first so the snapshot starts at once). Snapshot rows are inserted into the per-session table so the transaction need not stay open while the facility pages.
Why: comment at `CSM:566-570` gives the data-integrity reason (a child in the snapshot with its parent missing), not the reason the speaker gave (which is the same idea).
Notes: `createMarkedForSyncPatientsTable` (`CSM:503-517`) and the first count (`CSM:495`) run before the transaction; `PatientFacility.count` at `CSM:596` runs inside it. A patient marked between those points is harmless: it either lands in the full table and re-pulls next time, or is picked up next time because its tick is above `pullUntil` (inference).

### PLL-26a Exact order of operations in `setupSnapshotForPull` (answer to question 1)
Source: Part 2 00:21:12 to 00:46:32
Verdict: confirmed (by reading)
Evidence: `CSM:449-651`, in order:
1. `CSM:456-458` get `models`, `sequelize`; `connectToSession` (loads the session and sets `lastConnectionTime`, `CSM:220-252`).
2. `CSM:462` `startSnapshotWhenCapacityAvailable`: loops every 500 ms until an `UPDATE sync_sessions SET snapshot_started_at = NOW()` succeeds, which it does only while fewer than `sync.numberConcurrentPullSnapshots` (4) sessions are mid-snapshot (`packages/central-server/app/sync/startSnapshotWhenCapacityAvailable.js:4-37`).
3. `CSM:467` tick-tock the clock; keep `tick` (call it T1).
4. `CSM:469` `waitForPendingEdits(T1)` (`CSM:436-447`): lists advisory `ShareLock` keys in `pg_locks`, keeps those `< T1`, and takes then releases `pg_advisory_xact_lock` on each, which blocks until their holders commit or roll back (`packages/database/src/sync/getSyncTicksOfPendingEdits.ts`, `waitForPendingEditsUsingSyncTick.ts`).
5. `CSM:471-475` `getLookupSourceTickRange(since, T1)`.
6. `CSM:477-480` session `pullSince = since`, `pullUntil = T1`.
7. `CSM:482-487` session parameters: `minSourceTick`, `maxSourceTick`, `tablesForFullResync`, `useSyncLookup`.
8. `CSM:489-491` `modelsToInclude` from `tablesToInclude`, else all models.
9. `CSM:495-497` `newPatientFacilitiesCount` (rows with tick `> since` for these facilities).
10. `CSM:503-517` create the full marked table, then the regular marked table.
11. `CSM:519-535` the `syncAllLabRequests` query.
12. `CSM:537-557` resolve sensitive networks; more than one throws.
13. `CSM:559-564` build `sessionConfig`.
14. `CSM:571` begin the repeatable read transaction; `CSM:572-577` arm the timeout timer if `sync.snapshotTransactionTimeoutMs` is set (default null, `config/default.json5:55`).
15. `CSM:580-592` full pass (since -1, full table, patient-linked models, config `{ sensitiveNetworkId }`).
16. `CSM:596-598` `patientFacilitiesCount` (all marked rows for the facilities).
17. `CSM:601-611` incremental pass (`since`, regular table, `getModelsForPull`, full session config).
18. `CSM:615-628` optional full-resync pass (since -1, regular table).
19. `CSM:631` `removeEchoedChanges`.
20. `CSM:632` commit.
21. `CSM:635` `VACUUM (ANALYZE)` on the snapshot table (outside the transaction).
22. `CSM:640` `session.update({ snapshotCompletedAt })`, outside the transaction.
23. `CSM:647-650` finally: clear the timer, release the processing lock.
Changelog attachment is not part of this function: it happens when each page is served (`CSM:730-733`, PLL-63).
Why: comments quoted in the relevant entries.
Notes: error handling is `CSM:641-646` (`markSessionErrored`), and the lock is released regardless.

### PLL-26b `syncAllLabRequests`: where set and everything it changes (answer to question 4)
Source: Part 2 00:25:56 to 00:29:57
Verdict: confirmed (by reading)
Evidence:
- Set: a facility-scope setting `sync.syncAllLabRequests` (constant `SETTING_KEYS.SYNC_ALL_LAB_REQUESTS`, `packages/constants/src/settings.ts:10`), declared in `packages/settings/src/schema/facility.ts:278-282`, default `false`, description `_`. It lives under `sync` with `exposedToWeb` and `highRisk`.
- Resolved at `CSM:519-535` and `CSM:562` (any facility in the session; not mobile; not initial sync). It is a session-wide flag, not per facility.
- Lookup path (`SOC:286-293`): adds `OR is_lab_request IS TRUE` to the scope clause (PLL-55). Rows flagged are the lab request and its dependants plus the encounter (PLL-25).
- Model path: `LabRequest.buildPatientSyncFilter` returns `''` (all rows; `packages/database/src/models/LabRequest/LabRequest.ts:310-312`); `Encounter` adds a join on encounters with lab requests (`Encounter.ts:375-399`); `LabTest.ts:119`, `LabTestPanelRequest.ts:80`, `LabRequestAttachment.ts:57` and `buildNoteLinkedSyncFilter.ts:105-107` (all lab-request notes) do likewise.
- Not changed: the full pass for newly marked patients never gets it (`CSM:589-591`).
Why: n/a.
Notes: the encounter flag on the lookup side is only set when a lab request was recently attached (`Encounter.ts:418-419`), so an old encounter with an old lab request is not flagged. `onCreateEncounterMarkPatientForSync` is deliberately create-only so that pulled lab-request encounters do not mark their patient for sync (`packages/database/src/utils/onCreateEncounterMarkPatientForSync.ts:1-9`).

### PLL-30 `since` is set by the client; `until` is the tick at repeatable read entry; pending edits waited on a different tick; data beyond is re-sent
Source: Part 2 00:34:10, 00:35:21, 00:36:32, 00:37:48
Verdict: partly (answer to question 2)
Evidence:
- `since`: the facility reads `FACT_LAST_SUCCESSFUL_SYNC_PULL` (`lastSuccessfulSyncPull`, `packages/constants/src/facts.ts:12`), defaulting to -1 (`FacilitySyncManager.js:332`), and posts it. Mobile reads the fact of the same name from its local facts (`MobileSyncManager.ts:240`, `packages/mobile/App/services/sync/constants.ts:11`). Central only checks it parses (`buildSyncRoutes.js:224-228`).
- Waited tick: T1 (`CSM:467-469`), filtered to pending ticks `< T1`.
- `pullUntil`: the same T1, stored at `CSM:477-480`, returned in `fetchPullMetadata` (`CSM:701-711`) and in the streamed end message or `pull/metadata` response (`buildSyncRoutes.js:272-285`).
- Client cursor: the facility writes `pullUntil` to `lastSuccessfulSyncPull` inside its save transaction (`FacilitySyncManager.js:366-372`); mobile does so in `postPull` (`MobileSyncManager.ts:543-565`).
- Upper bound of the snapshotted data: none. No query adds `<= pullUntil`.
- Beyond-tick data: confirmed. A lookup row with a tick above T1 that is visible when the repeatable read snapshot begins is sent; next time `since = T1` so it is selected again (`updated_at_sync_tick > :since`).
Why: comments at `CSM:464-466` (the tick is safe because later changes have later ticks) and `CSM:566-570`.
Notes: so the speaker's picture of "pending-edits tick" versus "repeatable-read tick" is not what the code does; there is one tick. Hence the cursor is conservative: it says "everything up to T1 is here", and anything later is a bonus that is repeated. The `since` comparison is strict (`>`), and the clock is advanced by 2 per tick-tock, so central writes stamped at the tock (`T1+1` for the same call) are above T1.

### PLL-31 Tick-tock can block for a long time during a persist; is persist the only time it blocks?
Source: Part 2 00:36:32
Verdict: confirmed; answer: persist is not the only case
Evidence: `incrementValue` is a plain `UPDATE local_system_facts ... RETURNING` (`packages/database/src/models/LocalSystemFact.ts:83-100`), which takes a row lock held to the end of the surrounding transaction. Transactions that tick-tock inside themselves: persist (`CSM:752-789`, tick-tocks at `:763` and `:787`) and the lookup build's after-commit stamping transaction (`CSM:359-370`, tick-tock at `:363`). The latter's comment says it is wrapped so that writes to the current tick wait for the commit (`CSM:360-361`). All other callers (`CSM:196`, `:339`, `:467`) tick-tock outside a transaction and so only wait.
Why: comments at `CSM:166-168` (session start can block while another client is persisting).
Notes: that is why a snapshot's tick-tock is a synchronisation point with lookup stamping (PLL-34 evidence).

### PLL-32 Remove echoed changes: delete outgoing records that are also incoming with the same saved tick
Source: Part 2 00:37:48
Verdict: confirmed
Evidence: `packages/database/src/sync/removeEchoedChanges.ts:5-25`: `DELETE FROM <snapshot> outgoing USING <snapshot> incoming` where record type and id match, `incoming.saved_at_sync_tick = outgoing.saved_at_sync_tick`, `updated_at_by_field_sum IS NOT DISTINCT FROM`, incoming direction versus outgoing direction. Called at `CSM:631` unconditionally, inside the transaction, after all passes.
Why: inline comments at `removeEchoedChanges.ts:13-14`: "don't remove if an update has happened outside of this session" and "don't remove if the merge and save updated some fields".
Notes: the same snapshot table holds both directions for the session, which is why a self-join works.

### PLL-33 Incoming sync hooks did not change data, only decoded buffers
Source: Part 2 00:37:48 (correction)
Verdict: partly
Evidence: `packages/database/src/sync/incomingSyncHook.ts:15-60` lets a model's hook return inserts and updates into the incoming snapshot; `bumpSyncTickForRepull` (`CSM:790`, `packages/database/src/sync/bumpSyncTickForRepull.ts:20-55`) takes incoming rows flagged `requires_repull` and writes `updated_at_sync_tick = 1` to the source rows (the sync-tick trigger rewrites that to the current tick), so the originating facility pulls the modified version.
Why: comment at `CSM:789`.
Notes: so some hooks do change data and are meant to echo back. This works because the new tick differs from the persist tock, so neither `removeEchoedChanges` nor the avoid-repull device match (PLL-56) removes the row.

### PLL-34 Remove echoed changes is redundant now that the lookup table is used
Source: Part 2 00:39:17, 00:41:31, 00:42:35
Verdict: partly (answer to question 6)
Evidence for redundancy:
- Incoming snapshot rows are stamped with the persist `tock` (`CSM:775-780`). Outgoing rows on the lookup path take `saved_at_sync_tick` from `sync_lookup.updated_at_sync_tick` (`SOC:254`).
- For rows built after the initial build, lookup ticks are stamped by `updateSyncLookupPendingRecords` using the `tick` half of a tick-tock (`CSM:363-364`, `packages/central-server/app/sync/updateLookupTable.js:507-521`). `tickTockGlobalClock` returns `tick = tock - 1` and advances by 2, so ticks and tocks have opposite parity and a lookup tick can never equal a persist tock (derived from `CSM:127-134`; inference on parity).
- So the equality `incoming.saved_at_sync_tick = outgoing.saved_at_sync_tick` can only hold where the lookup row copied the source record's tick: the initial build (`CSM:378-380`), a per-model full rebuild for rows at or below `since`, or the self-heal pass (`buildSyncLookupSelect.ts:20-30`). None of those happen in the window between a persist and the pull of the same session.
- Echo prevention now comes from the avoid-repull device filter (PLL-56).
Evidence against removing it outright:
- The call is unconditional (`CSM:631`), so it still runs and still protects the model path (lookup disabled) where it is the only mechanism.
- The test config disables the lookup, so the central tests exercise it; I found no direct test of it (`removeEchoedChanges` is referenced only in `CSM`, its own file, and `index.ts`).
Why: PR #6545 (SAV-837, 2024-10-14), "Avoid repull pushed changes from the previous sync session when using sync lookup", added the device filter after the lookup table shipped, which fits the speaker's recollection that echoes were initially tolerated on the lookup path.
Notes: the speaker's "within the same sync it can't happen" reasoning is right for steady state; the stronger argument is the parity point above. Deleting `removeEchoedChanges` would be safe only together with removing the model path.

### PLL-35 `updated_at_by_field_sum` is a checksum for field-wise tables
Source: Part 2 00:40:28
Verdict: confirmed
Evidence: column in the snapshot table (`manageSnapshotTable.ts:47`: "used to check whether record has had changes to field during merge and save component of push phase"). Incoming: sum of the values of `data.updatedAtByField` (`CSM:858-860`). Outgoing, model path: `sum(value::text::bigint)` over `json_each(updated_at_by_field)` joined per row (`SOC:71`, `:79-93`), only for models that have an `updatedAtByField` attribute (`SOC:45`). Outgoing, lookup path: copied from `sync_lookup.updated_at_by_field_sum`, populated by the lookup build (`updateLookupTable.js:70-80`, `buildSyncLookupSelect.ts:57`). It is compared with `IS NOT DISTINCT FROM` in `removeEchoedChanges.ts:14`, so records without it (null on both sides) still match.
Why: the speaker's reason (a field-wise merge or a change on central between push and pull must not be removed as an echo) matches the comment at `removeEchoedChanges.ts:13-14`.
Notes: the sum catches a field-level change that left the row tick unchanged (field timestamps are per-field; the row tick is not the only signal). It is a sum, so two changes that cancel would not differ (inference; not a practical case since timestamps only grow).

### PLL-36 The echo-removal code is not under the lookup flag; lookup path removes echoes differently
Source: Part 2 00:41:31, 00:42:35
Verdict: confirmed
Evidence: `CSM:631` has no condition. Lookup-side mechanism: `pushed_by_device_id` and `avoidRepull` (PLL-56).
Why: PR #6545.
Notes: see PLL-34.

### PLL-37 Vacuum analyse after the snapshot so pulls can use index-only scans
Source: Part 2 00:42:35
Verdict: confirmed (answer to question 11)
Evidence: `CSM:633-635` and `packages/database/src/sync/manageSnapshotTable.ts:126-130`: `VACUUM (ANALYZE) "sync_snapshots"."<sessionId>";` run outside any transaction (VACUUM cannot run inside one). The snapshot table is created with `autovacuum_enabled = off` (`manageSnapshotTable.ts:51-53`) and two indexes `(direction, id) INCLUDE (record_type)` and `(direction, record_type, id)` (`:54-55`) that serve the paging query.
Why: comment at `CSM:633-634` ("mark pages all-visible and refresh stats so pulls use index-only scans"); added by PR #7983.
Notes: the explanation that autovacuum is off so the manual vacuum is the only one is inference (no comment on the `autovacuum_enabled = off`). Cleanup of the table is at session end (PLL-22).

### PLL-38 Session update must happen outside the repeatable read transaction
Source: Part 2 00:42:35, 00:43:56, 00:45:17, 00:46:32
Verdict: confirmed
Evidence: `CSM:636-640` comment ("the repeatable read isolation level can suffer serialization failures if a record is updated inside and outside the transaction, and the session is being updated to show the last connection time throughout the snapshot process"). The competing writes are `connectToSession`'s `session.update({ lastConnectionTime })` (`CSM:244`), called on every poll of `pull/ready` (`checkPullReady`, `CSM:673-693`, calls it twice).
Why: the code comment above.
Notes: on timing of the failure, the speaker guessed commit time; PostgreSQL raises "could not serialize access due to concurrent update" at the conflicting `UPDATE` statement under repeatable read (general PostgreSQL behaviour, not read from this repo). Other session writes before the transaction (`CSM:477-487`) are outside it too.

### PLL-27 Snapshot transaction timeout
Source: Part 2 00:32:32
Verdict: partly
Evidence: `CSM:572-577`: if `sync.snapshotTransactionTimeoutMs` is set, `setTimeout(() => { throw new Error('Snapshot ... timed out') }, ms)`; cleared at `CSM:648`. Default `null` (`packages/central-server/config/default.json5:55`), so it is off unless configured. Introduced by PR #6139 (SAV-740, "Automatically cancel long snapshots").
Why: PR title and `git log -S` history (#6139 and its hotfix backports).
Notes: throwing inside a `setTimeout` callback does not propagate to the awaited transaction or the surrounding `try`; it surfaces as an uncaught exception on the process (inference from JS semantics; no `uncaughtException` handler found in central server code, only `uncaughtExceptionMonitor` in `ReportRequestProcessor.js:43`). No test references this option. A related, different timeout is `sync.syncSessionTimeoutMs` (`CSM:229-236`).

### PLL-39 Lookup table is under a rollout feature flag; both paths exist
Source: Part 2 00:46:32, 00:47:46, 00:48:33
Verdict: partly (answer to question 5)
Evidence: flag key `sync.lookupTable.enabled` in config (not settings), default `true` (`packages/central-server/config/default.json5:58-62`); `packages/central-server/config/test.json5:23-26` sets it to `false`. Related keys in the same block: `perModelUpdateTimeoutMs` (null) and `avoidRepull` (true by default, undefined in test config). Dispatch at `SOC:355-377`. Read through the global `config` module via `withConfig` (`packages/shared/src/utils/withConfig.js`), not through `CentralSyncManager.config`; the manager reads its own overridable copy for the session-start guard (`CSM:191`, errors if lookup is enabled and has never been built) and the unused `useSyncLookup` parameter (`CSM:486`).
Why: `specs/sync/lookup-table.md` (line "Outgoing sync snapshots read exclusively from the lookup table") states the intended behaviour, which the code does not enforce.
Notes: in production the non-lookup path (`snapshotOutgoingChangesFromModels`, `SOC:132-185`) is reachable only by setting `sync.lookupTable.enabled` to false in central config. It also lacks sensitive-network scoping (`sensitiveNetworkId` is read only in the lookup branch; no model filter references it), so it must not be used with networks (inference from grep). The test default config is `lookupTable.enabled: false` (`packages/central-server/__tests__/utilities.js:162-168`), and many test files override it (see `CentralSyncManager.syncLookup.test.js:62-69`), so both paths are covered by tests.

### PLL-39a Remaining callers of model-level `buildSyncFilter` / `buildPatientSyncFilter` (answer to question 5)
Source: Part 2 00:46:32 onward
Verdict: confirmed (by grep over `packages/`, excluding tests)
Evidence: the filters are called in exactly two places:
1. `SOC:30-40` (model path only).
2. `packages/central-server/app/sync/buildFacilityBootstrap.js:46`: `model.buildSyncFilter() ?? 'WHERE TRUE'` for nine bootstrap models (`ReferenceData`, `SensitiveNetwork`, `Facility`, `User`, `UserFacility`, `Role`, `Permission`, `Setting`, `TranslatedString`; `buildFacilityBootstrap.js:15-25`), with `since: -1`. This is load-bearing and independent of the lookup flag.
Existence (not calls) of `buildPatientSyncFilter` is also load-bearing: `getPatientLinkedModels` (`getPatientLinkedModels.js:1-5`) uses `!!model.buildPatientSyncFilter` to choose the models for the full pass (`CSM:582`) and to build the patient-clause decision in the lookup query (`SOC:193-198`, PLL-51).
Static counts: 57 model files define `buildSyncFilter`, 67 define `buildPatientSyncFilter` (`packages/database/src/models`). Lookup population does not call either; it uses each model's `buildSyncLookupQueryDetails` (other ledger).
Why: n/a.
Notes: so the old filters are partly dead code (the SQL bodies, on the lookup path) and partly load-bearing (bootstrap; patient-link marker; tests).

### PLL-40 Central `snapshotOutgoingChanges` has two paths
Source: Part 2 00:48:33
Verdict: confirmed
Evidence: `SOC:342-378`.
Why: n/a.
Notes: the facility has its own, unrelated `packages/facility-server/app/sync/snapshotOutgoingChanges.js` (push).

### PLL-41 Old path: per model, build the patient filter if declared, return early on null, else use `buildSyncFilter`
Source: Part 2 00:49:54
Verdict: confirmed
Evidence: `SOC:29-40`: `modelHasPatientSyncFilter` picks the patient filter built with `(patientCount, markedForSyncPatientsTable, sessionConfig)`; a `null` result returns 0 immediately; otherwise `model.buildSyncFilter()`. Invalid sync directions throw before any work (`SOC:143-156`). Errors are rewrapped per model (`SOC:174-178`).
Why: comment at `SOC:35-36`.
Notes: a filter of `''` (e.g. `LabRequest` with the flag on) is not null and falls through to the default `WHERE <table>.updated_at_sync_tick > :since` at `SOC:94`.

### PLL-42 The model-path query: INSERT ... SELECT with `json_build_object`, default where, ID paging
Source: Part 2 00:51:26, 00:52:41
Verdict: confirmed
Evidence: `SOC:53-115`: inserts `direction`, `is_deleted` (`deleted_at IS NOT NULL`), `record_type`, `record_id`, `saved_at_sync_tick`, `updated_at_by_field_sum`, `data` (built from the model attributes minus `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`, `COLUMNS_EXCLUDED_FROM_SYNC`, `packages/database/src/sync/constants.ts:6-11`). Where clause is the filter or the default. Paging: `AND <table>.id > :fromId`, `ORDER BY <table>.id`, `LIMIT :limit`, returns `MAX(record_id)` and `count`, looped until `maxId` is null (`SOC:52-120`).
Why: n/a.
Notes: chunk size is `sync.maxRecordsPerSnapshotChunk`, 1,000,000,000 by default so effectively one chunk (`config/default.json5:51-53`).

### PLL-43 Generic patient filter via patient id
Source: Part 2 00:53:51, 00:55:08
Verdict: confirmed
Evidence: `packages/database/src/sync/buildPatientSyncFilterViaPatientId.ts:1-9`: null when `patientCount === 0`, else `WHERE patient_id IN (SELECT patient_id FROM <marked table>) AND updated_at_sync_tick > :since`. `PatientAdditionalData` is `BIDIRECTIONAL` (`packages/database/src/models/PatientAdditionalData.ts:96`) and uses it (`:161`). Also used by `PatientAllergy`, `PatientBirthData`, `PatientCarePlan`, `PatientCondition`, and others.
Why: n/a.
Notes: the speaker's "everything with a patient id except encounter" is close but not exact: encounter-linked and note models have their own builders.

### PLL-44 Encounter filter: marked patients, plus encounters with lab requests when the flag is on
Source: Part 2 00:55:08, 00:56:24
Verdict: confirmed
Evidence: `packages/database/src/models/Encounter.ts:359-413`: `encounters.patient_id IN (marked table)` when `patientCount > 0`; with the flag, a `LEFT JOIN` on a subquery of encounters with lab requests, grouped by `e.id`, taking `max(lr.updated_at_sync_tick)`, excluding patients already in the marked table; the where is the OR of include clauses ANDed with an OR of tick clauses; returns null if there are no include clauses.
Why: the `NOT IN` carries the comment "no need to sync if it would be synced anyway" (`Encounter.ts:385`).
Notes: the group-by is the dedupe for several lab requests per encounter.

### PLL-45 Syncs-everywhere models define `buildSyncFilter` returning null; enforcement
Source: Part 2 00:58:19
Verdict: confirmed (answer to question 8)
Evidence: `Facility.ts:115-117` and `ReferenceData.ts:214-216` return null with comment "syncs everywhere". Enforcement is a runtime check, not a test: `Model.validateSync` is called from `Model.init` (`packages/database/src/models/Model.ts:88`) and throws if a `BIDIRECTIONAL` or `PULL_FROM_CENTRAL` model has neither function (`Model.ts:106-129`: "DEV: ... must implement either buildSyncFilter or buildPatientSyncFilter. If it syncs everywhere, simply implement buildSyncFilter and return null."). The same function insists syncing models have timestamps on (`Model.ts:108-113`), and `init` requires a declared sync direction (`Model.ts:82-87`).
Why: the comment at `Model.ts:112-118` states the reason ("to make sure it is considered").
Notes: I found no test pinning the check. Models that do not pull (push-only, do-not-sync) are exempt. Facility-specific reference data (`ReferenceDrugFacility`) is a separate model with `buildSyncFilter` scoped by `facility_id IN (:facilityIds)` (`ReferenceDrugFacility.ts:71`).

### PLL-46 Encounter-linked generic filter
Source: Part 2 00:59:33, 01:01:01
Verdict: confirmed
Evidence: `packages/database/src/sync/buildEncounterLinkedSyncFilter.ts:13-46`. Tables are joined in the order given: each join is `LEFT JOIN <next> ON <prev>.<join column> = <next>.id`, the join column defaulting to the singularised next table name plus `_id` (or taken from a `{ model, joinColumn, required }` config; `required` makes it `INNER`). The where is `encounters.patient_id IN (marked table) AND <first table>.updated_at_sync_tick > :since`. Used by about 37 models (e.g. `ImagingRequest.ts:288-296` with `[table, 'encounters']`; `ImagingResult.ts:84-92` with `[table, 'imaging_requests', 'encounters']`; `Discharge`, `EncounterDiagnosis`, `Triage`, `Vitals`, `Task`, the invoice family).
Why: n/a.
Notes: the same join builder is reused for the lookup joins (`buildEncounterLinkedLookupFilter.ts`).

### PLL-47 Lab requests: empty filter when the flag is on, else encounter-linked
Source: Part 2 01:01:01
Verdict: confirmed
Evidence: `LabRequest.ts:305-319`: `''` with the flag; null if `patientCount === 0`; else `buildEncounterLinkedSyncFilter([table, 'encounters'], ...)`.
Why: n/a.
Notes: `''` means "no restriction", handled by the default where in `SOC:94`.

### PLL-48 Notes filter, and "we do not sync notes for lab requests where sync-all is on"
Source: Part 2 01:01:01, 01:02:23
Verdict: partly
Evidence: `buildNoteLinkedSyncFilter.ts:69-116`: ORs of (a) `notes.record_id IN (marked patients) AND record_type = 'Patient'`, (b) patient through the encounter for `Triage`, `LabRequest`, `ImagingRequest`, (c) `<table>.patient_id IN (marked)` for every other record type; joins at `:31-67`. With `syncAllLabRequests`, it appends `notes.record_type = 'LabRequest'` (`:105-107`), so all lab-request notes are sent on the model path. On the lookup path notes are built with `buildEncounterLinkedLookupSelect(this, { patientId: getPatientIdColumnOfNotes() })` and no `isLabRequestValue` (`packages/database/src/models/Note.ts:125-132`), so they have `is_lab_request = false` and arrive only for marked patients. The speaker's statement matches the production path and contradicts the old code.
Why: not recorded in code; the speaker's remark that nobody has complained is unverifiable.
Notes: a developer enabling the model path would see a different set. Also `patientCount === 0` returns null (no notes at all), so with no marked patients and the flag on, the model path sends no notes.

### PLL-49 Comment on adding note record types, and naming quirks
Source: Part 2 01:03:37
Verdict: confirmed
Evidence: `packages/constants/src/notes.ts:8` ("IMPORTANT: if you add any more record types, you must also alter buildNoteLinkedSyncFilter"), mirrored at `packages/mobile/App/ui/helpers/constants.ts:169`. Names in code: `buildPatientSyncFilterViaPatientId` (not "build patient linked sync filter"), `buildEncounterLinkedSyncFilter`, `buildNoteLinkedSyncFilter` (`packages/database/src/sync/index.ts:5-6`); the lookup counterparts are `buildPatientLinkedLookupFilter` and `buildEncounterLinkedLookupFilter`.
Why: n/a.
Notes: nothing enforces the comment by test, but `Note.initRelations` iterates the same list (`Note.ts:76-82`), and the lookup path derives its patient id from `getPatientIdColumnOfNotes()` which is built from the same constant (`buildNoteLinkedSyncFilter.ts:16-29`).

### PLL-50 Lookup snapshot query shape
Source: Part 2 01:04:50
Verdict: confirmed
Evidence: `SOC:237-308`: inserts into the snapshot table from `sync_lookup`, copying `id` as `sync_lookup_id`, `is_deleted`, `record_type`, `record_id`, `updated_at_sync_tick` as `saved_at_sync_tick`, `updated_at_by_field_sum`, and `data` as is (already built). Looped in chunks by `id > :fromId ORDER BY id LIMIT :limit`, using `MAX(sync_lookup_id)` as the next cursor (`SOC:234`, `:261`, `:301-307`, `:325-328`). Full where clause is PLL-52.
Why: n/a.
Notes: indexes available on `sync_lookup`: `(updated_at_sync_tick, record_id, patient_id, facility_id)` and `patient_id` (baseline `000_baseline.sql:8521-8528`), a partial index on `needs_rebuild`, and a partial index on `sensitive_network_id` (`1789695736424-createSensitiveNetworks.ts:83`). I did not run a plan.

### PLL-51 `getPatientRelatedWhereClause` and the "all record types are for patients" branch (answer to question 7)
Source: Part 2 01:06:01, 01:07:43, 01:08:57
Verdict: partly
Evidence: `SOC:187-212`. It computes the table names of patient-linked models (`getPatientLinkedModels(models)`, i.e. those declaring `buildPatientSyncFilter`) and whether every record type being snapshotted is in that list.
- All patient-linked: `patient_id IN (SELECT patient_id FROM <marked table>)` when `patientCount` is non-zero, else `FALSE`.
- Otherwise: `(patient_id IS NULL OR patient_id IN (...))`, else `patient_id IS NULL`.
It is built so that raw SQL needs no edit when a model is added: the patient-linked set is derived from the models' declared filters (the speaker's reading is right). It is the full pass that hits the first form on every pull, because that pass passes only patient-linked models (`CSM:582`). With zero newly marked patients that gives `FALSE`, so the query returns nothing without scanning for null-patient rows.
Why: PR #6506 (SAV-831, 2024-09-27), "Improve sync lookup performance when there is no new patients marked for sync", which introduced the function; its title states the purpose.
Notes: the second form is not equivalent in the full pass: `(patient_id IS NULL OR ...)` at `since = -1` would pull every null-patient row of those record types (all history). Whether any exist depends on the lookup builders (e.g. `Notification.patientId` is nullable, `Notification.ts:56-66`; not checked further). So Jasper's "redundant" is probably not right.

### PLL-52 Where clause on the lookup path: every branch (answer to question 7)
Source: Part 2 01:10:35, 01:12:13
Verdict: confirmed
Evidence: `SOC:259-300`. Conjunction of:
1. `updated_at_sync_tick > :since`.
2. `data IS NOT NULL` (excludes stub rows awaiting rebuild, `specs/sync/lookup-table.md`; tombstones are not excluded: soft-deleted rows have `is_deleted = true` and carry their data).
3. `fromId` paging.
4. A parenthesised block that is `(patient clause AND scope clause) OR is_lab_request IS TRUE` (the lab part only if `syncAllLabRequests`):
   - patient clause from `getPatientRelatedWhereClause` (PLL-51);
   - scope clause (`SOC:271-285`): `(facility_id IS NULL AND sensitive_network_id IS NULL) OR facility_id IN (:facilityIds) [OR sensitive_network_id = :sensitiveNetworkId]`, the last arm only if the session resolved a network.
5. `record_type IN (:recordTypes)`, the table names of the models in this pass.
6. If `avoidRepull && deviceId`: `(pushed_by_device_id <> :deviceId OR pushed_by_device_id IS NULL)`.
Quoted comment (`SOC:271-273`): "a record is unscoped only when it carries neither a facility nor a network. a network scoped record has a null facility_id too, so testing facility_id alone would admit every sensitive record to every facility".
Why: `specs/sync/sensitive-networks.md` ("Admitting a record to a facility"); the clause was changed in PR #10903 (2026-10-02).
Notes: observed combinations: facility set, network null (appointments, patient facility links, facility-scoped settings); both null (patient-linked rows and sync-everywhere rows; the patient clause separates them); patient set with network set, facility null (encounter-linked rows at a networked facility, `buildEncounterLinkedLookupSelect`, `buildEncounterLinkedLookupFilter.ts:14`). A network-scoped row still needs its patient to be marked, since the patient clause is ANDed (spec: "Network scoping widens which facilities a record can reach, and nothing else"). Pre-flight guard: a session spanning more than one network throws (`CSM:552-556`). The spec says a facility can belong to one network only.

### PLL-53 Sensitive-network example
Source: Part 2 01:12:13
Verdict: confirmed (mechanism); example details not repeated here
Evidence: PLL-52 and `specs/sync/sensitive-networks.md`.
Why: n/a.
Notes: the question of how careful central reports are with sensitive facility data is outside this area (see Unresolved).

### PLL-55 Sync-all-lab-requests on the lookup path adds an OR for the flag
Source: Part 2 01:13:26
Verdict: confirmed, with a precision
Evidence: `SOC:286-293`. Because AND binds tighter than OR, the OR sits at the outer level of the parenthesised block, so a flagged row bypasses the patient clause, the facility clause and the network clause. It is still limited by tick, non-null data, record type and the avoid-repull exclusion (all ANDed outside the block). The caller restricts it to incremental, non-mobile sessions (`CSM:562`).
Why: `specs/sync/sensitive-networks.md`: "A facility configured to sync all lab requests receives every lab request, ahead of patient and network scoping."
Notes: the speaker said "record type in the record types being synced" is part of the OR; in the code it is a separate AND at `SOC:295`, with the same effect.

### PLL-56 Avoid repull: exclude records pushed by this device
Source: Part 2 01:13:26
Verdict: confirmed
Evidence: query side `SOC:296-300`, config `sync.lookupTable.avoidRepull` default true (`default.json5:61`; read at `SOC:231`). Population side: `pushed_by_device_id` is taken from a join on `sync_device_ticks ON persisted_at_sync_tick = <table>.updated_at_sync_tick` (`updateLookupTable.js:83-86`), and `sync_device_ticks` rows are written at persist (`CSM:781`). The exclusion needs `deviceId`, which central takes from `req.device.id` (`buildSyncRoutes.js:221-236`).
Why: PR #6545 (SAV-837).
Notes: the join is on the source tick equalling the persist tock, so a record changed again on central after the persist (different tick) is not excluded, which is why hook-modified records re-pull (PLL-33). Without `avoidRepull` the left join is a constant null (`updateLookupTable.js:87`).

### PLL-57 Lookup update uses the models' own logic
Source: Part 2 01:14:50
Verdict: confirmed (at a glance; other ledger)
Evidence: `CSM:382-389` passes `getModelsForPull` to `updateLookupTable`, which uses each model's `buildSyncLookupQueryDetails` (`select`, `joins`, `where`, `filter`), not `buildSyncFilter`.
Why: n/a.
Notes: not verified in depth.

### PLL-63 Changelog attachment and `getOutgoingChanges` (answer to questions 9 and 10)
Source: Part 2 00:22:50 and 00:19:34
Verdict: confirmed (by reading)
Evidence: `CSM:713-735`. It reads one page of the snapshot, ordered by model dependency order then snapshot id (`packages/database/src/sync/findSyncSnapshotRecords.ts:56-101`: a `priority` CTE with each pull model's `sortInDependencyOrder` rank, `ORDER BY priority.sort_order, id LIMIT :limit`, resume predicate `(sort_order, id) > (:lastRecordTypeOrder, :lastId)` decoded from a base64 `{ sortOrder, id }` cursor, applied only when both are truthy). Then, unless the session is mobile or the tick range is missing (`CSM:726-728`), `attachChangelogToSnapshotRecords` (`packages/database/src/utils/audit/attachChangelogToSnapshotRecords.ts:14-58`) queries `logs.changes` for `updated_at_sync_tick >= minSourceTick AND <= maxSourceTick AND (table_name, record_id) IN (VALUES ...)` in batches of 10,000 (`packages/utils/src/runFunctionInBatches.ts`), and sets `changelogRecords` on each outgoing record.
Polling versus streaming:
- Polling: `GET /:sessionId/pull?fromId=&limit=` returns one page; the facility chooses the limit (dynamic) and the cursor is the base64 `{ sortOrder, id }` of the last record (`pullIncomingChanges.js:36-46`); it loops until it has `totalToPull` rows or an empty page.
- Streaming: `GET /:sessionId/pull/stream` loops server-side in batches of `sync.databasePollBatchSize` and writes each record as a message until a batch is empty (`buildSyncRoutes.js:306-343`), with the cursor problem in PLL-15.
Why: `specs/audit/changelog.md:52-61` (attached, not synchronised separately; hard deletes leave their entry behind).
Notes: `totalToPull` comes from `countSyncSnapshotRecords` over outgoing rows after echo removal (`CSM:701-711`). The `logs.changes` read has a tick index (`changes_updated_at_sync_tick_index`, `000_baseline.sql:7023`) but the predicate also uses `(table_name, record_id) IN (VALUES ...)`; the project's own rule on `logs.changes` reads (`llm/project-rules/coding-rules.md`) asks the PR to name the index. The tick range bounds it.

## Open questions answered

- "Is persist on central the only time we block tick tock?" (Part 2 00:36:32): no. The lookup build's after-commit stamping transaction also holds the clock row lock (PLL-31).
- "Are client push snapshots kept in memory or the database?" (Part 1 00:42:30, 00:43:28): memory. `pushChanges` takes `outgoingChanges` as an in-memory array from `snapshotOutgoingChanges(this.sequelize, modelsForPush, pushSince)` and pushes it (`FacilitySyncManager.js:312-322`). Only the incoming (pull) side uses a snapshot table on the facility (PLL-06). Jasper's `direction` column is the snapshot-table column that separates incoming and outgoing rows, used on central (PLL-32).
- "How does the sync lookup table remove echoed changes?" (Part 2 00:41:31): by `avoidRepull` and `pushed_by_device_id` (PLL-56); `removeEchoedChanges` is not conditional but is effectively dead on that path (PLL-34).
- "Can wait-for-pending-edits be removed from `setupSnapshotForPull`?" (Part 2 00:15:46): the code does not settle it. Evidence in favour: the lookup build does its own `waitForPendingEdits(currentTick)` (`CSM:341`) and stamps rows at a later tick inside the clock row lock (`CSM:359-370`), so a snapshot whose tick-tock completes after that commit sees all rows stamped up to its tick. Evidence against: the wait is still the model path's guard and the test that pins it (`CentralSyncManager.setupSnapshotForPull.test.js`, "handles in-flight transactions") runs on the model path with the default test config. Any removal should be accompanied by removing the model path.
- "Is the all-record-types branch ever hit?" (Part 2 01:07:43): yes, by the full pass every time (PLL-51).
- "Was `until` different from the tick waited on?" (Part 2 00:35:21): no, same tick (PLL-30).
- "Was a note's lab-request behaviour a product decision?" (Part 2 01:02:23): not recorded in code or PR text that I read; unresolved.
- "How is `sensitive_network_id` populated?" (Part 2 01:13:26): in the lookup build (`buildEncounterLinkedLookupSelect` takes `facilities.sensitive_network_id` through `locations`/`facilities`; see `buildEncounterLinkedLookupFilter.ts:9-37`). Other ledger covers it.

## Not in the transcript

- A snapshot session has two cursors for different jobs: the session's `startedAtTick` (from `prepareSession`, `CSM:196-197`, used for push) and `pullUntil` (PLL-30). They are not the same value.
- Capacity control: `numberConcurrentPullSnapshots` (4) gates how many snapshots run at once, and `maxConcurrentSessions` (4) gates sessions (`CSM:116-125`, `startSnapshotWhenCapacityAvailable.js`). Both are config, not settings.
- A session whose facilities span more than one sensitive network is refused (`CSM:552-556`); the test is `packages/central-server/__tests__/sync/CentralSyncManager.sensitiveFacilities.test.js`.
- `sessionConfig.syncAllLabRequests` is session-wide and excluded for mobile and initial sync (PLL-23); the full pass drops everything but `sensitiveNetworkId` (PLL-04).
- Models with a `PUSH_TO_CENTRAL` direction can sit in `modelsToInclude` for the full pass; the lookup path filters by `record_type IN (...)`, the model path throws on invalid directions (`SOC:143-156`).
- The snapshot table's `sync_lookup_id` column records which lookup row an outgoing row came from; `requires_repull` is incoming-only (`manageSnapshotTable.ts:48-50`).
- `getLookupSourceTickRange` relies on `sync_lookup_ticks` never being pruned (PR #11532 body); `README`-level doc of this table is `specs/sync/lookup-table.md`, which does not mention it.
- Tests that pin this area: `CentralSyncManager.setupSnapshotForPull.test.js` (marked patients, concurrency, lab requests, in-flight transactions, duplicate display ids), `snapshotOutgoingChanges.test.js` and `snapshotOutgoingChanges.syncLookup.test.js`, `getLookupSourceTickRange.test.js`, `getPatientLinkedModels.test.js`, `CentralSyncManager.getOutgoingChanges.test.js`, `CentralSyncManager.syncLookup.test.js`, `CentralSyncManager.sensitiveFacilities.test.js`, `facilityBootstrap.test.js` (all under `packages/central-server/__tests__/sync/`).

## Unresolved

- Whether the streaming pull route really fails on the second batch: I traced it by reading and a Node check of `atob`, but did not run it. Next: an integration test of `GET /pull/stream` with more than one batch.
- Whether a soft-deleted `sync.syncAllLabRequests = true` settings row keeps the flag on. Next: save a settings tree without the key and re-run the `CSM:520-535` query.
- Whether any lookup rows of patient-linked record types can have a null `patient_id` (which would make the simplified second form of `getPatientRelatedWhereClause` change behaviour in the full pass). Next: query `sync_lookup` for null `patient_id` by record type on a real dataset.
- Whether the uncaught throw in the snapshot timeout timer is handled anywhere (process-level handler). Next: check central's process bootstrap and an integration test with a very low timeout.
- Whether the reports question (sensitive facility data in central reports) is covered anywhere; it is outside the pull path.
- The history behind `autovacuum_enabled = off` on snapshot tables is not in the code or PR text I read (the vacuum reason is; the autovacuum-off reason is inference).
