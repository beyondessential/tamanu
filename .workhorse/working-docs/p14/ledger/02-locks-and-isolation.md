# Locks, isolation levels, pending edits, session capacity (LCK)

Code checked at main, commit `22d3edaa36`. Paths are relative to the repository root. `CSM` below means `packages/central-server/app/sync/CentralSyncManager.js`. Postgres behaviour that I did not exercise (no servers or tests were run) is marked `inference`.

## Drift

- LCK-03, LCK-04: advisory locks are not the only explicit lock. The importer takes a row lock (`FOR UPDATE`) on the `currentSyncTick` row; lookup builds use `FOR KEY SHARE`; `tickTockGlobalClock` row-locks the clock row for the length of any enclosing transaction. Partly.
- LCK-07: "you can't sync while an import is happening" is narrower than the advisory-lock story suggests. The advisory lock is taken by the trigger on every synced write, not "around" imports. What stops syncs during an import is the explicit `FOR UPDATE` on the clock row, which blocks every `tickTockGlobalClock` call (session prepare, pull snapshot, lookup build, push persist). Pushing into the snapshot table, polling and pulling an already-built snapshot are not blocked. Partly.
- LCK-09: there are two limits, both in config files (not settings): `sync.maxConcurrentSessions` (default 4) and `sync.numberConcurrentPullSnapshots` (default 4). Partly.
- LCK-14: "on the first lookup build we don't do it in one transaction" is wrong. The initial build runs inside the same repeatable read transaction as later builds. Partly.
- LCK-16: a queued device "keeps its place", but the queue is not first come first served. Order is urgent first, then lowest `lastSyncedTick`, among devices seen in the last 5 minutes. Partly.
- LCK-18: the create-session lock narrows but does not close the over-capacity race, because the capacity check is made before the lock and not repeated. Partly (inference on the residual window).
- LCK-26: the pending-edits wait in pull setup is not redundant. It still guards raw reads of `patient_facilities` ticks. The lookup build has its own wait. Partly.
- LCK-28: the snapshot transaction timeout is a `setTimeout` that throws inside the timer callback, which does not reject the snapshot promise. Default is off. Wrong mechanism (inference on the consequence).
- LCK-30: `pullUntil` is the same tick that pending edits were awaited for, not "the current tick on entering the repeatable read transaction". The snapshot query has no upper bound, so the "we may send more than we waited for" consequence still holds. Outdated.
- LCK-33: a repeatable read serialization failure is raised at the conflicting statement, not at commit. Wrong (Postgres semantics).
- LCK-35, LCK-37: "normal integers are reserved for ticks" is not written down anywhere and is not followed: `hashtext()` keys live in exactly the tick domain. "The worst that can happen is extra waiting" is wrong in one direction: the trigger's `try` lock can fail silently, leaving an edit untracked. Partly.
- LCK-41: the list of non-sync advisory locks is incomplete (document metadata and sync credentials also). Partly.
- LCK-42: tick-tock is called from five places (six calls), not four: persist calls it twice and the lookup build twice. Partly.
- Separate findings not from the transcript: the stream endpoints read settings at paths that do not exist in the schema (LCK-19); `addDebugInfo`'s `skipLocked` may be a no-op (Q7).

## Claims

### LCK-01 Two levels of concurrency control
Source: Part 1 00:56:33, 00:58:08
Verdict: partly
Evidence: Level two (multi-process, database level) is real: every cross-request guard is a Postgres lock or an `UPDATE ... WHERE` in the database (`CSM:91-114`, `CSM:277-303`, `packages/central-server/app/sync/startSnapshotWhenCapacityAvailable.js:4-31`). Level one (all clients resolve conflicts the same way) is not enforced by a lock. It is delivered by a single central clock plus serialised persists: the persist transaction updates the clock row at `CSM:763` via `LocalSystemFact.incrementValue` (`packages/database/src/models/LocalSystemFact.ts:83-103`, a plain `UPDATE ... RETURNING`), which holds the row lock until commit at `CSM:788`, so any other session's `tickTockGlobalClock` waits for it.
Why: comment at `CSM:758-762` says the tick-tock is "purely for saving with a unique tick" now and that concurrency control moved to the shared advisory locks. That comment is correct for what the tick is used for, but the row lock side effect still serialises persists against each other and against snapshot starts (see LCK-31).
Notes: the speaker could not remember what must be ensured on push. The code answer is: no two sessions persist at once, and nothing can start a snapshot or open a session (tick) while a persist is open.

### LCK-02 Advisory locks are arbitrary keys; can be checked or waited on
Source: Part 1 00:59:26, 01:00:42
Verdict: confirmed
Evidence: try variants return immediately (`CSM:95`, `CSM:297`, trigger `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:60`); blocking variants wait (`packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts:9`, `CSM:285`). The speaker's guess that Postgres "creates a record and locks that" is not right (advisory locks live in the shared lock table, not in a heap row) but it does not matter to Tamanu.
Why: n/a.
Notes: every advisory lock in the repo is transaction scoped (`..._xact_...`); there are no session-level locks and no `pg_advisory_unlock` calls. Inventory in "Not in the transcript".

### LCK-03 "Those advisory locks are what we use everywhere"
Source: Part 1 01:00:42
Verdict: partly
Evidence: Besides advisory locks, sync depends on: `FOR UPDATE` on the clock row in imports (`packages/central-server/app/admin/importer/importerEndpoint.js:100-103`); implicit row locks from `incrementValue` (`LocalSystemFact.ts:86-96`); `FOR KEY SHARE OF <table>` on lookup source rows (`packages/central-server/app/sync/updateLookupTable.js:101`); a `findOne({ skipLocked: true })` intended to avoid row locks (`packages/database/src/models/SyncSession.ts:77`, see Q7); and the capacity `UPDATE` (`startSnapshotWhenCapacityAvailable.js:15-19`).
Why: n/a.
Notes: see Q7 answer.

### LCK-04 "The one type of lock we have to manage that isn't automatic"
Source: Part 1 01:00:42 (second speaker)
Verdict: partly
Evidence: the importer takes an explicit row lock (`importerEndpoint.js:100-103`) and lookup builds take explicit `FOR KEY SHARE`. Advisory locks are the only ones that no database mechanism ever releases on its own except at transaction end, which is the property the speaker means, but they are not the only locks written by hand.
Why: n/a.

### LCK-05 Central admin writes need concurrency control; imports hit the race
Source: Part 1 01:00:42
Verdict: confirmed
Evidence: Admin panel and API writes on central go through the same `set_updated_at_sync_tick` trigger as any other write (latest definition: `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:36-68`). The importer additionally takes the clock row lock (`importerEndpoint.js:90-103`).
Why: comment at `importerEndpoint.js:94-100` explains the import-specific race.
Notes: only the importer has the explicit clock lock. Patient merge, admin panel edits and other central writes rely on the trigger alone (grep for `FACT_CURRENT_SYNC_TICK` in `packages/central-server/app` finds only the importer and `CentralSyncManager`).

### LCK-06 Import writes with the tick at write time but is invisible until commit
Source: Part 1 01:01:52
Verdict: confirmed
Evidence: trigger reads `currentSyncTick` and assigns it to `NEW.updated_at_sync_tick` (`1793235590139-...ts:55-63`). The import runs in one transaction (`importerEndpoint.js:87-122`) so its rows are invisible to snapshots until commit. The code comment at `importerEndpoint.js:94-100` describes the same hazard in the same terms.
Why: a client that completes at a tick above the import's tick would never see the import's rows.
Notes: the reframing the speaker made mid-sentence (rows carry the tick current when written, not a "closure") is the correct one.

### LCK-07 "We take advisory locks around any in-flight transaction... you can't sync while an import is happening"
Source: Part 1 01:03:15
Verdict: partly
Evidence: Two separate mechanisms, see Q3 for the full answer.
1. Trigger: every write to a synced table takes a shared tick lock (`1793235590139-...ts:60`). Waiters are the snapshot starters (`CSM:341`, `CSM:469`) and the facility push (`FacilitySyncManager.js:295`).
2. Import only: `SELECT ... FOR UPDATE` on the `currentSyncTick` row in `local_system_facts` (`importerEndpoint.js:100-103`), held for the whole import (including dry runs, which roll back at the end, `importerEndpoint.js:121`). Every `tickTockGlobalClock` call (`CSM:132`) is an `UPDATE` of that row and waits.
Why: `importerEndpoint.js:94-100`. Introduced as part of the Jan 2024 rename commit `455305890a` in its current location; the underlying idea predates the shared advisory lock, which arrived in PR #3530 (SAV-93, Feb 2023): its description reads "Take a shared lock from every create/update trigger ... Take an exclusive lock so from the facility sync manager so that it waits for all those transactions to complete".
Notes: the steps that wait during an import are: session prepare (`CSM:196`, so the session does not become ready; the client keeps polling), pull snapshot (`CSM:467`), lookup refresh (`CSM:339`), and push persist (`CSM:763`). Not blocked: `SyncSession.create` (`CSM:148`), pushing records into the snapshot table (`addIncomingChanges`), reading an already-built snapshot, `connectToSession`. A blocked session still counts against capacity (`CSM:116-125`, `completedAt` and `errors` null).

### LCK-08 Concurrency is "very locked down"; things happen one by one
Source: Part 1 01:03:15
Verdict: confirmed
Evidence: the serialisation points are: persist holds the clock row lock for its whole transaction (`CSM:752-788`); one create-session lock holder at a time (`CSM:91-114`); capacity limits (LCK-09); import holds the clock row for its whole duration; the lookup afterCommit wrapper holds the clock row while pending records are updated (`CSM:362-369`); the facility runs one sync at a time (`FacilitySyncManager.js:103-125`).
Why: n/a.

### LCK-09 Number of concurrent syncs is capped, configurable (four, not eight)
Source: Part 1 01:03:15, 01:04:24
Verdict: partly
Evidence: Two caps, both in config (`packages/central-server/config/default.json5:44-57`), not in the settings schema:
- `sync.maxConcurrentSessions`, default 4. Counts `sync_sessions` rows with `completed_at` and `errors` null (`CSM:116-125`). Checked at session creation (`buildSyncRoutes.js:118-122`).
- `sync.numberConcurrentPullSnapshots`, default 4. Counts sessions in the snapshot phase (`snapshot_started_at` set, `snapshot_completed_at`, `errors`, `completed_at` null). A session waits in a 500 ms sleep loop until a slot is free (`startSnapshotWhenCapacityAvailable.js:33-37`), with no ordering between waiters.
Why: PR #3566 (SAV-127) introduced the snapshot limit; PR #3586 tightened "the gap between where we check that there is capacity ... and where we record that the current snapshot has begun" into one query. `packages/central-server/app/subCommands/startApi.js:36-49` warns if `db.pool.max` (default 10, `default.json5:16-17`) is within 4 of `numberConcurrentPullSnapshots`, because each snapshotting session holds two pooled connections (session lock transaction plus the repeatable read transaction).
Notes: the single-query check in `startSnapshotIfCapacityAvailable` counts in a CTE under read committed and updates only its own row, so two sessions can both see count 3 and both claim a slot (inference; no test covers it, grep of tests finds no reference to `numberConcurrentPullSnapshots`).

### LCK-10 Debug info written straight into `sync_sessions` columns
Source: Part 1 01:13:12 (also 01:06:17)
Verdict: confirmed
Evidence: `packages/database/src/models/SyncSession.ts:10-34` has `startTime`, `lastConnectionTime`, `snapshotStartedAt`, `snapshotCompletedAt`, `persistCompletedAt`, `completedAt`, `debugInfo` (JSON), `parameters` (JSONB), and more.
Why: n/a.

### LCK-11 Mark session as processing = open a transaction and take `pg_advisory_xact_lock`; unmark ends it
Source: Part 1 01:13:12
Verdict: confirmed
Evidence: `CSM:277-293`. `sequelize.transaction()` is called without a callback, so this is an unmanaged transaction on its own pooled connection (and, with CLS, not bound to the caller's async context). It runs `SELECT pg_advisory_xact_lock(:sessionLockId)` (blocking, exclusive) and returns a function that does `transaction.commit()`.
Why: comment `CSM:278-283`: must be readable across processes if central runs in cluster mode, and must clear itself if the process restarts.
Notes: key is `uuidToFairlyUniqueInteger(sessionId)` (`packages/shared/src/utils/uuidToFairlyUniqueInteger.js:4`): the first 12 hex digits of the session id, so a 48-bit value. Session ids come from `gen_random_uuid()` (`packages/database/src/models/Model.ts:101-104`), a v4 UUID, so those 48 bits are random.

### LCK-12 It is inter-process communication, not concurrency control
Source: Part 1 01:14:50
Verdict: confirmed
Evidence: `checkSessionIsProcessing` (`CSM:295-303`) runs `SELECT NOT(pg_try_advisory_xact_lock(:id))` as a bare statement: if it gets the lock it is released at the end of that statement and reports "not processing"; if not, it reports "processing". Any Node process can answer it.
Why: `CSM:277-283`.
Notes: full operation list in Q4.

### LCK-13 startSession: create the session, release on error, prepare, always release
Source: Part 1 01:16:31
Verdict: confirmed
Evidence: `CSM:136-184`. Order: generate id, `markSessionAsProcessing` (145), `SyncSession.create` (148); if create throws, unmark and rethrow wrapped (155-164). Otherwise `prepareSession(...).finally(unmark)` (169), not awaited unless `sync.awaitPreparation` is set for tests (173). `prepareSession` (`CSM:186-210`) checks the lookup built-once guard, `createSnapshotTable`, `tickTockGlobalClock`, `markAsStartedAt(tick)`. On any error the session is marked errored (208).
Why: comment `CSM:166-169`: the tick-tock may block behind a persist, so the client polls for readiness.
Notes: `createSnapshotTable` (`packages/database/src/sync/manageSnapshotTable.ts:32-57`) creates a table named after the session id inside a dedicated schema (`getSnapshotTableName`, line 18-22); the speaker's "sync_snapshots.<session ID>" guess is about right. `startSession` returns only `{ sessionId }`, so `tick` in the `goodToGo` response (`buildSyncRoutes.js:139-146`) is always `undefined` and omitted from the JSON; clients get the tick from `GET /:sessionId/metadata` (`buildSyncRoutes.js:184-191`, `CentralServerConnection.js:180-183`).

### LCK-14 Lookup table must have built once before any sync; reason guessed
Source: Part 1 01:16:31, 01:18:24
Verdict: partly
Evidence: `CSM:188-193` throws "Sync lookup table has not yet built" if `config.sync.lookupTable.enabled` and `lookupUpToTick` is nil. `enabled` is `true` in `packages/central-server/config/default.json5:58-59` but remains a config key. The guessed reason (initial build is not one transaction) is wrong: `updateLookupTable` runs both initial and incremental builds in one `repeatableReadTransaction` (`CSM:350-415`), and sets `FACT_LOOKUP_UP_TO_TICK` in that same transaction (`CSM:414`). What differs on the first build: rows take their `updated_at_sync_tick` from the source tables (`syncLookupTick = null`, `CSM:378-380`) and the "pending update" flag pass is skipped (`CSM:353-357`).
Why: inference: until the first build commits the lookup holds nothing, so a pull would silently return no data. The fact is set only at commit, so the nil check is exact.
Notes: lookup internals belong to another ledger.

### LCK-15 Stale sessions are closed when a device starts a new one
Source: Part 1 01:27:55
Verdict: confirmed
Evidence: `buildSyncRoutes.js:72-97` finds every session with `completedAt` null whose `parameters.deviceId` is this device, and calls `completeSyncSession(store, id, 'Session marked as completed due to its device reconnecting')` (`packages/database/src/sync/completeSyncSession.ts:4-18`). With an error argument that only runs `markErrored` (sets `completedAt`), and does not drop the snapshot table.
Why: comment `buildSyncRoutes.js:82-83`; sessions are held in memory on the client, so a restarted client forgets its session.
Notes: this closes any incomplete session of the device, not only "stale" ones. Separately, `StaleSyncSessionCleaner` (`packages/central-server/app/tasks/StaleSyncSessionCleaner.js:19-55`) runs every minute (`default.json5:243-247`) and closes sessions with `lastConnectionTime` older than `staleSessionSeconds` (3600). Errored snapshot tables are dropped later by `SnapshotTableCleaner` (retention 24 h, runs 01:00-05:59, `default.json5:254-262`, `SnapshotTableCleaner.js:30-35`).

### LCK-16 Capacity is checked and the request is queued; queue position is kept; urgent
Source: Part 1 01:27:55, 01:28:59
Verdict: partly
Evidence: Model `SyncQueuedDevice` (`packages/database/src/models/SyncQueuedDevice.ts:11-99`): primary key is the device id, so there is at most one row per device. `checkSyncRequest` (60-98) finds or creates it, and on repeat requests updates `lastSeenTime`, `lastSyncedTick`, and `urgent: urgent || queueRecord.urgent` (88-92), so an urgent request is never downgraded by a later scheduled one. It then returns `getNextReadyDevice` (50-58): among rows with `lastSeenTime` within the last 5 minutes (`SYNC_READY_WINDOW_MINUTES`, line 9, 42-48), ordered `urgent DESC`, `lastSyncedTick ASC`.
Why: n/a.
Notes: "same place in the queue" is therefore not arrival order; it is "furthest behind first", with urgent first. Only the device at the front may proceed. A front device that stops polling blocks everyone for up to 5 minutes. Queue rows are never deleted except when the device is granted a session (`buildSyncRoutes.js:137`); stale rows are simply excluded by the 5-minute window (grep finds no other writer). Urgent comes from the facility's `POST /run` (`packages/facility-server/app/routes/apiv1/sync.js:23`) and from mobile's urgent mode, which re-requests every 10 s by default (`packages/mobile/App/services/sync/MobileSyncManager.ts:164-188`). The facility's scheduled sync is `*/1 * * * *` (`packages/facility-server/config/default.json5:11`). I did not check the mobile 5-minute schedule.

### LCK-17 What the client is told at each outcome
Source: Part 1 01:30:01
Verdict: confirmed
Evidence: `buildSyncRoutes.js:55-150`. Outcomes: not at front, `{ status: 'waitingInQueue', behind: queueRecord }` (109-115); at front but capacity full, `{ status: 'activeSync' }` (118-122); at front, capacity free, create-session lock not acquired, `{ status: 'activeSync' }` (124-129); success, `{ status: 'goodToGo', sessionId, tick }` (146); `ForbiddenError` or `InvalidParameterError` for bad auth or no facilities (66-70). Facility and mobile treat any response without a `sessionId` as "queued" and do not branch on the status string (`CentralServerConnection.js:153-156`, `FacilitySyncManager.js:207-211`, `MobileSyncManager.ts` logs it).
Why: n/a.
Notes: `behind` returns the front device's whole queue row, including its `facilityIds`, to a different device. Line 105 is a leftover `log.warn('DEBUG device=...')` that logs at warn on every request.

### LCK-18 Create-session lock stops two handlers over-filling capacity
Source: Part 1 01:30:01, 01:31:40
Verdict: partly
Evidence: `takeCreateSessionLock` (`CSM:91-114`) opens an unmanaged transaction and runs `pg_try_advisory_xact_lock(CREATE_SESSION_ADVISORY_LOCK)`; it returns a release function that commits, or `null` after rollback when the lock is busy. Key is `stringToStableInteger('createSessionAdvisoryLock')` (`CSM:50`), the low 48 bits of a SHA-256. In the route the lock is held from `buildSyncRoutes.js:124` until `finally` at 147-149, covering `queueRecord.destroy()` and `startSession` (not the background `prepareSession`).
Why: PR #9181 (COOL-38): "only a single sync session can be created at once ... if we ensure we take the lock before, and only release once we've created the session, we should never be able to exceed the limit." The speaker's reading matches.
Notes: the PR text says "take the lock before" the check, but the code checks capacity first (`buildSyncRoutes.js:118`) and does not re-check after taking the lock. Sequence that exceeds the limit (inference): handler B passes the capacity check; handler A takes the lock, creates a session and releases; B takes the lock and creates another. The pinning test (`packages/central-server/__tests__/sync/SyncQueuedDevice.test.js:214-247`) staggers requests by 500 ms against a 2 s id generation delay, so B and C meet a held lock and never hit this window. It is a try lock, so the loser gets `activeSync` rather than waiting.

### LCK-19 Streaming option to wait for readiness
Source: Part 1 01:31:40
Verdict: confirmed
Evidence: `GET /:sessionId/ready/stream` and `pull/ready/stream` (`buildSyncRoutes.js:194-217`, `253-276`), used by the client when `centralServer.streaming()` (`CentralServerConnection.js:162-178`). Setting `sync.streaming.enabled` defaults to `false` (`packages/settings/src/schema/central.ts:230-238`).
Why: n/a.
Notes: the stream endpoints read `sync.databasePollInterval` and `sync.databasePollBatchSize` (`buildSyncRoutes.js:207, 266, 320`), but the schema defines `sync.streaming.databasePollInterval` and `sync.streaming.databasePollBatchSize` (`central.ts:240-251`). The paths do not match (inference: the reads return undefined, which would make `sleepAsync(undefined)` spin). Feature is off by default; whoever reads this area should check it.

### LCK-20 Trigger bumps tick and takes a lock on that tick value
Source: Part 2 00:06:59, 00:08:20
Verdict: confirmed
Evidence: `1793235590139-...ts:36-68` (latest definition of `set_updated_at_sync_tick`, the final migration to redefine it; earlier ones are `000_baseline.sql:1191` and `1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts`, plus `1784602019354-...` before the 1793... change). Logic: if `local_system_facts.syncTrigger = 'disabled'`, return unchanged (43-45); if `NEW.updated_at_sync_tick = -1`, store `-999` and take no lock (51-52); else read `currentSyncTick` (55), `PERFORM pg_try_advisory_xact_lock_shared(current_tick)` (60), assign it (63).
Why: PR #3530 (SAV-93) title "Stop multi-step transactions skipping sync"; PR #7540 (SAV-947) "Take advisory lock -before- updating sync tick" produced the current ordering (lock, then assign). The comment in the function: "record that an active transaction is using this sync tick".
Notes: it is a try lock and its result is discarded. Consequences in LCK-37. The lock is held to the end of the writing transaction. Every table carrying the trigger takes the lock; a transaction touching many rows takes it once (re-taking a held lock is a no-op).

### LCK-21 Pull setup waits for pending edits using pg_locks object ids
Source: Part 2 00:08:20
Verdict: confirmed
Evidence: `CSM:469` calls `this.waitForPendingEdits(tick)` (`CSM:436-447`), which calls `getSyncTicksOfPendingEdits` (`packages/database/src/sync/getSyncTicksOfPendingEdits.ts:10-16`):
`SELECT objid AS tick FROM pg_locks WHERE locktype = 'advisory' AND mode = 'ShareLock'`
then keeps ticks `t < tick` and, for each, awaits `waitForPendingEditsUsingSyncTick` in a `Promise.all` (`CSM:444-446`).
Why: comment `getSyncTicksOfPendingEdits.ts:4-9`: advisory locks are global, so only select shared-mode locks (the trigger's) to avoid picking up the exclusive locks (session processing, create-session, waiters).
Notes: full mechanism in Q2.

### LCK-22 Does it wait for any pending edit or only the range being synced?
Source: Part 2 00:08:20
Verdict: confirmed (answer)
Evidence: only ticks strictly below the session's own tick (`CSM:438-440`, `t < tick`). There is no lower bound: ticks below `since` are waited for too if still held. Strict `<` is exact: `tickTockGlobalClock` moves the clock from `tock-2` to `tock` and returns `tick = tock-1` (`CSM:127-134`), so no write is ever stamped with `tick` itself; writes stamped `tock` or later come after the session's tick.
Why: n/a.

### LCK-23 Wait function requests the lock and returns when it is free
Source: Part 2 00:10:13
Verdict: confirmed
Evidence: `waitForPendingEditsUsingSyncTick.ts:6-14` runs `SELECT pg_advisory_xact_lock(:syncTick)` (exclusive, blocking). It is issued as a bare statement (not inside an explicit transaction at any call site), so the lock is acquired once every shared holder has committed or rolled back and is released immediately when the statement's implicit transaction ends.
Why: comment `waitForPendingEditsUsingSyncTick.ts:3-5`.
Notes: if a caller ever ran it inside a transaction the exclusive lock would be kept, making `pg_try_advisory_xact_lock_shared` in the trigger fail for every concurrent writer on that tick (inference from Postgres lock semantics). Waiters on one tick are not de-duplicated: `pg_locks` returns one row per holding backend, so the same tick can be awaited several times concurrently, each on its own pooled connection and with no concurrency cap (`CSM:444-446`). This runs against the project's own limit-concurrency rule (`llm/project-rules/coding-rules.md`).

### LCK-24 Cannot rely on serializable; "we're not locking out much"
Source: Part 2 00:10:13, 00:12:06
Verdict: partly
Evidence: On advancing the clock the speaker is right for ordinary writers (the trigger does not touch the clock row; `getSyncTicksOfPendingEdits` waiters block only for held ticks). On central, though, `tickTockGlobalClock` is an `UPDATE` of the clock row and so waits on any open transaction that has already updated it (persist, lookup afterCommit wrapper) or locked it (import). See LCK-31 and Q3.
Why: n/a.

### LCK-25 Range-based worked example and why waiting is needed
Source: Part 2 00:12:06 to 00:14:49
Verdict: confirmed
Evidence: The "commit ten minutes after sync finished" hazard is the reason: the client persists `pullUntil = tick` (`CSM:477-480`) as its cursor, so a row stamped below that tick committing later is never pulled. Pinned by `packages/central-server/__tests__/sync/CentralSyncManager.setupSnapshotForPull.test.js:829-899`: three uncommitted patient inserts at ticks 4, 6, 8 with `since: 2`; the snapshot must wait and then include all three.
Why: n/a.
Notes: in the speaker's scenario (import started at tick 7) the clock lock would stop the sync's own tick from ever being issued while the import is open (LCK-07).

### LCK-26 Pending-edits wait may be removable from pull setup now that pulls use the lookup table
Source: Part 2 00:14:49, 00:15:46
Verdict: partly
Evidence: The lookup build does have its own wait: `updateLookupTable` takes a tick and calls `this.waitForPendingEdits(currentTick)` before reading (`CSM:339-341`), and records `currentTick` as its high-water mark in the same transaction (`CSM:414`). So lookup-based pulls are protected at build time, as the speaker suspected they would need to be. But pull setup still reads raw tables by tick range: `PatientFacility.count({ updatedAtSyncTick > since })` (`CSM:495-497`) and `createMarkedForSyncPatientsTable`, which selects `patient_facilities` by `updated_at_sync_tick > :since` or `<= :since` (`packages/central-server/app/sync/createMarkedForSyncPatientsTable.js:16-21`). Those need the wait. The wait also still serves the non-lookup path (`config.sync.lookupTable.enabled` false).
Why: inference: removing it would let a late-committing `patient_facilities` row be missed in the marked-patients set for a session whose cursor then moves past it.
Notes: the lookup's own `updated_at_sync_tick` is written at build time using ticks from the build's own tick-tock (`CSM:363`), which is why the raw-tick wait no longer protects lookup rows; the build wait does.

### LCK-27 Pull setup runs the snapshot in a repeatable read transaction, writes to a snapshot table
Source: Part 2 00:31:19
Verdict: confirmed
Evidence: `CSM:571-632`. `repeatableReadTransaction` (`packages/database/src/sync/transactions.ts:17-26`) starts the transaction and immediately runs `SELECT 1` (comment, lines 10-11: a transaction does not start until the first query, so this pins the snapshot as early as possible). The snapshot table is created earlier by `prepareSession`, outside this transaction, so the inserts here go to a table the transaction controls.
Why: comment `CSM:566-570`: other changes made during the snapshot must not be included, otherwise a pair of foreign-keyed records could land with the child but not the parent.
Notes: the whole snapshot is held in the snapshot table so the repeatable read transaction does not have to stay open while the facility pulls pages (transcript is right; `getOutgoingChanges`, `CSM:713-735`, reads the table without a transaction).

### LCK-28 Transaction timeout on snapshots
Source: Part 2 00:32:32
Verdict: partly
Evidence: Config key `sync.snapshotTransactionTimeoutMs`, default `null` (disabled) (`packages/central-server/config/default.json5:57`); read at `CSM:572-577`. If set, a timer is armed inside the transaction callback and cleared in `finally` (`CSM:648`). The timer body is `throw new Error('Snapshot for session ... timed out')`. A throw inside a `setTimeout` callback is an uncaught exception; it does not reject the awaited snapshot. The repo has no `uncaughtException` handler (only an `uncaughtExceptionMonitor` in the report child, `packages/central-server/app/tasks/ReportRequestProcessor.js:43`), so Node would terminate the central process (inference). On restart the database releases all session locks and the repeatable read transaction; clients then hit "Snapshot processing incomplete, likely because the central server restarted during the snapshot" (`CSM:683-689`) from `checkPullReady`.
Why: PR #6182 (SAV-740) "Automatically cancel long snapshots"; the earlier hotfix PR #6248 "Restart long running syncs" added `syncSessionTimeoutMs` (Q5). The original design note in that PR's commit list was "just cancel sync if snapshot is taking too long". No test covers this key (grep of `__tests__`).
Notes: if the intent is to fail only the one session, this does not do it. It would also take down other in-flight sessions on that process.

### LCK-29 Snapshot passes: full, incremental, optional resync
Source: Part 2 00:32:32, 00:34:10
Verdict: confirmed
Evidence: `CSM:579-628`: full pass since `-1` over `getPatientLinkedModels` with the newly-marked patients table; incremental pass with `since` and `sessionConfig`; third pass for `tablesForFullResync` with since `-1`; then `removeEchoedChanges` (631).
Why: n/a.

### LCK-30 `since` set by client; `until` set at transaction entry and differs from the pending-edits tick
Source: Part 2 00:34:10, 00:35:21, 00:36:32, 00:37:48
Verdict: outdated
Evidence: `since` is passed by the client (`buildSyncRoutes.js:224-229`). `until` is `tick` from the tick-tock at `CSM:467`, the same value passed to `waitForPendingEdits(tick)` at 469 and stored as `pullUntil` at 477-480, then returned to the client as its next cursor (`fetchPullMetadata`, `CSM:701-711`). Nothing reads "the current tick at repeatable read entry". The part that is still true: neither the snapshot-from-lookup query nor the raw query has an upper bound, only `updated_at_sync_tick > :since` (`packages/central-server/app/sync/snapshotOutgoingChanges.js:94, 259`), so records stamped above `tick` can be sent and will be sent again next time because the client's cursor is `tick`. `getLookupSourceTickRange` (`getLookupSourceTickRange.js:13-41`) uses `pullUntil` as an exclusive bound for the changelog attachment only.
Why: n/a.
Notes: the speaker said he was happy with this conclusion; the conclusion about over-delivery holds, the premise about differing ticks does not.

### LCK-31 Tick-tock can pause for a long time during a persist; is persist the only blocker?
Source: Part 2 00:36:32
Verdict: confirmed (and answered)
Evidence: persist updates the clock row inside its transaction (`CSM:763`, `LocalSystemFact.ts:86-96`); the row lock lasts until commit (`CSM:788`). Other things that hold the clock row for longer than a statement: the importer (`importerEndpoint.js:100-103`); the lookup build's afterCommit wrapper, which does a tick-tock then `updateSyncLookupPendingRecords` then creates the `SyncLookupTick` inside one transaction (`CSM:362-369`, comment 360-361: "any writes to currentSyncTick will have to wait until this transaction is committed"). No other code writes the row for long (grep).
Why: `CSM:758-762`.

### LCK-32 Update to the session after the snapshot happens outside the repeatable read transaction
Source: Part 2 00:42:35, 00:45:17, 00:46:32
Verdict: confirmed
Evidence: code comment `CSM:636-640`; the update is `session.update({ snapshotCompletedAt })` after the transaction (640). Polling updates the same row: every readiness poll calls `connectToSession`, which does `session.update({ lastConnectionTime })` (`CSM:244`). Within the snapshot transaction no code writes to `sync_sessions` any more: `addDebugInfo` calls are all outside (`CSM:708, 744, 833, 857`), `setParameters` and the `pullSince`/`pullUntil` update are before it (`CSM:477-484`), and `markSessionErrored` runs after it aborts (`CSM:646`).
Why: Postgres raises `40001` ("could not serialize access due to concurrent update") when a repeatable read transaction updates a row that another transaction changed and committed after its snapshot. Comment at `CSM:566-570` also says the transaction only reads plus writes to its own snapshot table.
Notes: there is no retry of serialization failures anywhere in sync (grep for `40001`: only `updateLookupTable.js:10` which classifies it, and a test). A failure fails the session (`CSM:641-646`) or, for the lookup build, aborts the build and waits for the next scheduled run (Q6).

### LCK-33 Serialization failure is thrown at commit time; repeatable read is "for reads"
Source: Part 2 00:43:56, 00:45:17
Verdict: wrong (timing); the habit is accurate
Evidence: Postgres raises the repeatable read "concurrent update" error when the conflicting `UPDATE` or `SELECT ... FOR UPDATE/KEY SHARE` runs (after waiting for the other transaction if it is still open), not at `COMMIT`. Commit-time serialization failures belong to `SERIALIZABLE` (predicate-lock conflicts). Not exercised here; this is documented Postgres behaviour, and the lookup test that pins `40001` at the statement (`packages/central-server/__tests__/sync/CentralSyncManager.updateLookupTable.test.js:1055-1118`) is consistent with it.
Why: n/a.
Notes: the "reads only unless controlled by this transaction" rule is how the snapshot is built. The lookup build breaks it on purpose: it writes `sync_lookup` and takes `FOR KEY SHARE` inside repeatable read (`CSM:350-415`, `updateLookupTable.js:94-101`).

### LCK-34 Lookup under a rollout flag
Source: Part 2 00:46:32, 00:47:46
Verdict: confirmed
Evidence: `sync.lookupTable.enabled` is `true` in `default.json5:58-59`; the non-lookup path remains in `snapshotOutgoingChanges.js` (selected on `config.sync.lookupTable.enabled`).
Why: n/a.

### LCK-35 Advisory lock key space has no registry; ticks are reserved normal integers
Source: Part 3 01:31:50, 01:33:18
Verdict: partly
Evidence: Confirmed that nothing prevents reuse: each call site derives its own key (inventory below). The "normal integers are reserved for ticks" rule appears nowhere in code, `specs/`, `llm/` or `docs/` (grep for "advisory" outside migrations finds only the call sites and two comments). The one place that reasons about ranges is `packages/database/src/services/reporting.js:19`: "int8 keys above the int4 range hashtext() returns, so they can't collide with other locks", which protects against `hashtext` keys, not against ticks.
Why: n/a.
Notes: the tick domain is int4. `incrementValue` does `value::integer + :amount` (`LocalSystemFact.ts:89`), so ticks cannot exceed 2147483647 and the sum would error. Keys above 2^31 therefore cannot equal a tick.

### LCK-36 The function takes a bigint (corrected from "integer")
Source: Part 3 01:33:18
Verdict: confirmed
Evidence: JS call sites pass numbers up to 2^48 via replacements (`CSM:97, 286`; `Device.ts:178-181`; `Invoice.ts:260-264`). Postgres declares `pg_advisory_xact_lock(bigint)` and `(int, int)`. SQL call sites pass `hashtext(...)` (int4) or a `::bigint` literal.
Why: n/a.

### LCK-37 Hashing means a clash is possible; worst case is extra waiting, no deadlock
Source: Part 3 01:33:18
Verdict: partly
Evidence: see Q1 in "Not in the transcript". Short version: a clash of a blocking exclusive key with a live tick key does cause extra waiting (the blocking taker waits for in-flight shared holders). But the trigger takes its shared lock with a non-blocking `try` and ignores the result (`1793235590139-...ts:60`), so if an exclusive holder of the same key exists, the trigger quietly does not register its tick and that edit is invisible to `getSyncTicksOfPendingEdits` (which filters on `ShareLock`). A deadlock cycle needs blocking takers on both sides, which is not impossible when a transaction holds a shared tick lock and later blocks on a hashed exclusive key (inference).
Why: n/a.
Notes: the probability is tiny: the colliding key must equal the current tick at the moment both locks are held.

### LCK-38 Biggest realistic tick, put other ids beyond it; or namespace by magnitude
Source: Part 3 01:34:30
Verdict: confirmed (feasible)
Evidence: ticks are bounded by int4 (LCK-35 notes). The 48-bit keys from `stringToStableInteger` (`packages/shared/src/utils/stringToStableInteger.js:9-10`, SHA-256 low 6 bytes) and `uuidToFairlyUniqueInteger` use the full range `0..2^48-1`, so a fraction of 2^-17 of them lands inside the tick domain. The reporting literals (7829301042, 7829301043) are above 2^32 and cannot match a tick. `hashtext()` keys (int4, about half non-negative) land entirely in the tick domain.
Why: n/a.

### LCK-39 Sync credentials lock
Source: Part 3 01:34:30
Verdict: confirmed
Evidence: `packages/central-server/app/admin/syncCredentials.js:55` takes `pg_advisory_xact_lock(hashtext('tamanu:sync-credentials:' || $deviceId))`, so it is per device, not one global key. Comment at lines 51-54 says "Both writes below are find-then-create, and a retried or double-submitted wizard request provisions the same device twice" (the transcript read "find-or-create").
Why: code comment.

### LCK-40 Device registration lock per user
Source: Part 3 01:38:24
Verdict: confirmed
Evidence: `packages/database/src/models/Device.ts:138-139, 177-182`: key `stringToStableInteger('deviceRegistrationAdvisoryLock:' + userId)`, blocking, taken inside a `SERIALIZABLE` transaction (125-174). Comment 117-123 explains the two races (double login creating two devices; quota overrun by simultaneous unknown devices).
Why: code comment.
Notes: the lock is the first query of that serializable transaction, so the snapshot is fixed before the wait; a waiter that then reads the other's committed device row may get a serialization failure rather than a clean read (inference; no retry exists).

### LCK-41 Non-sync advisory locks: invoice item, reporting, facility setup
Source: Part 3 01:38:24
Verdict: partly (list is incomplete)
Evidence: invoice item `Invoice.ts:257-266`; reporting `reporting.js:52, 104`; facility setup `packages/facility-server/app/routes/apiv1/setup.js:204`. Also not sync related and not mentioned: facility document metadata `packages/facility-server/app/utils/createDocumentMetadata.js:43`.
Why: n/a.

### LCK-42 Tick-tock call sites
Source: Part 3 01:38:24
Verdict: partly
Evidence: all calls to `tickTockGlobalClock`: `CSM:196` (prepare session), `CSM:339` (lookup build, before pending-edits wait), `CSM:363` (lookup build, in the afterCommit transaction), `CSM:467` (pull setup), `CSM:763` and `CSM:787` (persist, twice, inside its transaction). Comment on the second persist call (`CSM:784-786`): "no records that are subsequently modified will share the same sync tick as the incoming changes", so that records modified by `adjustDataPostSyncPush` are pulled in the same session and not stripped by `removeEchoedChanges`. The facility has no tick-tock; it sets its clock to the tick central issued (`FacilitySyncManager.js:292`).
Why: n/a.

## Open questions answered

- **Does pending-edits wait cover any pending edit or only the range being synced?** Every held shared tick strictly below the session's tick, with no lower bound (LCK-22).
- **Can persist on central be the only thing that blocks tick-tock?** No. Importer `FOR UPDATE` and the lookup afterCommit wrapper also hold the clock row (LCK-31).
- **How does the lookup table interact with pending edits / why wait in pull setup?** See LCK-26: build waits for its own tick; pull setup waits for raw `patient_facilities` reads and the non-lookup path.
- **Is `until` different from the pending-edits tick?** No in current code (LCK-30).
- **Does a serialization failure surface at commit?** No, at the statement (LCK-33).
- **Are serialization failures retried?** No retry anywhere in sync.
- **Does it reserve normal integers for ticks and is there a guard?** No guard, no written rule (LCK-35).
- **Can a hashed key collide with a tick and what happens?** See Q1 below.
- **Why is there a create-session lock?** PR #9181 body: stop two handlers over-filling the limit (LCK-18).

## Not in the transcript

### Q1 Inventory of advisory locks

All are transaction scoped and none is session scoped. "Key" is what is passed to Postgres.

| # | Where | Key | Mode | Held for | Waiters / probes | Purpose |
|---|---|---|---|---|---|---|
| 1 | Trigger `set_updated_at_sync_tick`, `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:60` (earlier definitions: `000_baseline.sql:1191`, `1744340076240-...ts:31,65`, `1784602019354-...ts:73,100`). On central and facility. | `currentSyncTick` fact (int4 domain) | Shared, `pg_try_advisory_xact_lock_shared`, result ignored | Until the writing transaction ends | Read by `getSyncTicksOfPendingEdits.ts:12-15` (`pg_locks`, `ShareLock`); awaited by #2 | Mark "a transaction is still using this tick" |
| 2 | `packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts:9`; callers `CSM:445` (via `CSM:341`, `CSM:469`) and `packages/facility-server/app/sync/FacilitySyncManager.js:295` | A held tick | Exclusive, blocking | Statement only | Waits for #1 holders | Wait out in-flight edits on a tick |
| 3 | `CSM:50, 95` | `stringToStableInteger('createSessionAdvisoryLock')` (SHA-256 low 48 bits) | Exclusive, `pg_try_advisory_xact_lock`, in its own unmanaged transaction | From route `buildSyncRoutes.js:124` to its `finally` (147-149) | Only other `takeCreateSessionLock` callers, who give up with `activeSync` | One session creation at a time |
| 4 | `CSM:285` (take, blocking), `CSM:297` (probe) | `uuidToFairlyUniqueInteger(sessionId)` (first 12 hex digits, 48 bits) | Exclusive, blocking take; probe is `NOT(try)` | Whole of session prepare, pull snapshot, or push persist, via its own unmanaged transaction | Probers: the session readiness and completion polls (Q4) | Cross-process "this session is working" flag |
| 5 | `packages/database/src/models/Device.ts:177-182` | `stringToStableInteger('deviceRegistrationAdvisoryLock:' + userId)` | Exclusive, blocking | Registration transaction (SERIALIZABLE) | Other registrations by the same user | Avoid double device and quota overrun. Not sync |
| 6 | `packages/database/src/models/Invoice/Invoice.ts:257-266` | `stringToStableInteger('addItemToInvoiceAdvisoryLock:' + invoiceId + modelName + itemId)` | Exclusive, blocking | Upsert transaction | Same item upserts | Emulate upsert against a deferrable constraint. Not sync |
| 7 | `packages/database/src/services/reporting.js:20, 52` | Literal `7829301043` | Exclusive, blocking | Transaction | Concurrent starters | One reporting secret across processes. Not sync |
| 8 | `reporting.js:21, 104` | Literal `7829301042` | Exclusive, blocking | Transaction | Concurrent role setup | Avoid "tuple concurrently updated" catalog races. Not sync |
| 9 | `packages/central-server/app/admin/syncCredentials.js:55` | `hashtext('tamanu:sync-credentials:' \|\| deviceId)` (int4) | Exclusive, blocking | Provisioning transaction | Same device | Avoid double provisioning. Provisioning for sync, not part of the sync engine |
| 10 | `packages/facility-server/app/utils/createDocumentMetadata.js:43` | `hashtext(JSON of owner, name, date)` (int4) | Exclusive, blocking | Transaction | Same document | Dedupe concurrent submissions. Not sync |
| 11 | `packages/facility-server/app/routes/apiv1/setup.js:204` | `hashtext('tamanu:facility-setup')` (int4) | Exclusive, blocking | Transaction | Concurrent setup requests | Close a check-then-write race. Not sync |

Key domains: ticks, int4 (`LocalSystemFact.ts:89`). `hashtext` keys (9, 10, 11), int4, half of them non-negative so inside the tick domain. 48-bit keys (3, 4, 5, 6), `0..2^48-1`, a 2^-17 share inside the tick domain. Reporting literals (7, 8) above 2^32, outside it.

Collision with a tick key, and effects (inference from Postgres lock semantics, nothing was run):
- Only a key equal to the current tick, held at the same time, matters, because the trigger only ever locks the current tick. For `hashtext` keys that is about 1 in 2^32 per acquisition; for 48-bit keys about 2^-48.
- A blocking exclusive taker with the same key waits for every in-flight shared holder of that tick (extra waiting, bounded by those transactions).
- If an exclusive holder is already present, the trigger's `try` shared lock returns false and is ignored, so that transaction's edit is not registered. `getSyncTicksOfPendingEdits` would not list it and the snapshot or push could proceed past it, which is the exact hazard the mechanism exists for. Exclusive holders also never appear in the pending list because of the `ShareLock` filter (`getSyncTicksOfPendingEdits.ts:4-9`).
- A deadlock needs a transaction that holds a shared tick lock and later blocks on a colliding hashed key while another holder waits the other way. I found no code that does so on a common path, but I did not prove its absence.
- No written rule and no guard against collision exists. The only comment is `reporting.js:19`. Because `pg_locks.objid` carries only the low 32 bits, the `ShareLock` filter, not the key range, is what keeps the larger keys apart from tick keys in the pending-edits query. `pg_locks` is also cluster-wide with no `database` filter (`getSyncTicksOfPendingEdits.ts:12-15`), so on a Postgres cluster hosting several Tamanu databases a shared tick lock from another database is returned and waited on (harmless: it takes a key in this database that nobody holds).

### Q2 Pending-edits mechanism end to end

Invariant: no transaction that stamped a record with a tick below a session's cursor can still be uncommitted when that cursor is handed to or recorded for a client, so no record can later appear below an advanced cursor.

1. Trigger: on every insert or update of a synced table (unless `syncTrigger = 'disabled'`, or the row is being written as incoming-from-central with `-1`), reads `currentSyncTick`, takes `pg_try_advisory_xact_lock_shared(tick)`, stamps the row (`1793235590139-...ts:36-68`). Lock lives until the writing transaction ends.
2. Finding held ticks: `SELECT objid AS tick FROM pg_locks WHERE locktype = 'advisory' AND mode = 'ShareLock'` (`getSyncTicksOfPendingEdits.ts:10-16`). `objid` is the low 32 bits of the key, which is the whole key for a tick. No dedupe, no database filter.
3. Waiting: `pg_advisory_xact_lock(:tick)` for each (`waitForPendingEditsUsingSyncTick.ts`), concurrently via `Promise.all`.
4. Call sites:
   - Central pull setup, `CSM:469`, with the pull's own `tick`; waits only for ticks `< tick` (`CSM:438-440`).
   - Central lookup build, `CSM:341`, with the build's `currentTick`.
   - Facility push, `FacilitySyncManager.js:295`: after setting the local clock to the new tick (`:292`), waits on the single old tick `currentSyncClockTime`, before taking the push snapshot (`:304`). It waits on one tick, not a set, because it knows which tick its own clock was on.
   - Mobile: none. `MobileSyncManager.ts:322-335` just sets the local tick; local storage is single writer (the speaker did not mention mobile).
5. Pinned by `CentralSyncManager.setupSnapshotForPull.test.js:829-899`. No test covers the facility push wait or the lookup build wait directly (grep).

Gaps a developer should know (inference): the trigger reads the tick with a plain `SELECT` and takes the lock in a separate statement, so there is a very small window where a writer reads tick T, the clock moves, a waiter finds no holder, and the writer then locks T. On the facility the clock is set by plain `UPDATE` (`FacilitySyncManager.js:292`) with no lock coordination. Not observed; flagged because the invariant depends on it.

### Q3 Central admin writes and imports

- Admin panel edits, patient merge and other central writes: trigger only (LCK-05).
- Import: trigger plus an explicit `SELECT ... FOR UPDATE` on the `currentSyncTick` row inside a `SERIALIZABLE` transaction (`importerEndpoint.js:90-103`), taken before any import work. Comment: all imported changes share one tick, and no pull snapshot can start during the import because snapshot start updates the clock.
- Literal truth of "can't sync while an import is happening": a sync can begin and poll, but any new session cannot become ready, no pull snapshot can start, no persist can run, and the lookup build stalls, until the import transaction ends (LCK-07). A facility mid-pull on an existing snapshot continues.
- Since the import's rows all carry the clock's value at import time and nothing can advance the clock past it while the import is open, the row lock makes the shared tick lock redundant for imports. It matters for writers that do not lock the clock (inference).
- Possible sharp edge (inference from Postgres semantics): the `FOR UPDATE` is the first statement of a `SERIALIZABLE` transaction, so its snapshot is taken then. If a persist is open and committed while that statement waits, Postgres raises a serialization failure on the lock query instead of proceeding. Nothing retries it (`importerEndpoint.js`). Worth testing before documenting as safe.

### Q4 "Session is processing"

- Take: `markSessionAsProcessing` opens an unmanaged transaction and blocking-locks the session's key (`CSM:277-293`). Release: commit. Crash: the connection drops and Postgres releases the lock.
- Probe: `checkSessionIsProcessing` (`CSM:295-303`), usable from any process.
- Operations that take it: `startSession` (prepare, `CSM:145`), `initiatePull` (pull snapshot, `CSM:317`), `completePush` (persist, `CSM:887`). Each unmarks in a `finally` (`CSM:169`, `649`, `893`).
- Operations that probe it: `initiatePull` guard (`CSM:312`, refuses a second pull), `checkSessionReady` (`CSM:655`), `checkPullReady` (`CSM:677`), `checkPushComplete` (`CSM:898`). Each, on finding it free, requires a completion marker (`startedAtTick`, `snapshotCompletedAt`, `persistCompletedAt`) or marks the session errored with a "likely because the central server restarted" message (`CSM:660-667, 683-689, 905-909`). A warning in `CSM:801-802` says a DB call added after `persistCompletedAt` must move it or change the check.
- `completePush` has no "already processing" guard; the take blocks, so a duplicate `push/complete` would wait for the first persist and then run persist again (inference). `initiatePull`'s check-then-take is not atomic, but the take blocks, giving the same shape.
- Cost: each held lock pins one pooled connection in an open transaction for the duration.

### Q5 Session creation, capacity, timeouts

- Order: stale-session close for the device, queue upsert, front-of-queue check, capacity check, create-session lock, queue row delete, `startSession` (`buildSyncRoutes.js:72-149`). The queue row is deleted before the session exists; if `startSession` throws, the device re-enters the queue behind others (comment 132-136).
- Timeouts (all config):
  - `sync.syncSessionTimeoutMs`, default `null` (off). Enforced only inside `connectToSession` when a poll arrives: if `updatedAt - createdAt` exceeds it and the session has no errors, the session is marked errored (`CSM:229-236`); this is "restart long running syncs" (PR #6248, SAV-740, with its two timeout tests in `CentralSyncManager.connectToSession.test.js:69-109`). It does not interrupt work already running in the background.
  - `sync.snapshotTransactionTimeoutMs`, default `null` (LCK-28).
  - `schedules.staleSyncSessionCleaner.staleSessionSeconds`, 3600, every minute.
  - Queue readiness window: 5 minutes, hard-coded (`SyncQueuedDevice.ts:9`).
- Snapshot capacity wait has no timeout and no ordering (`startSnapshotWhenCapacityAvailable.js:33-37`); the client's readiness polls keep `lastConnectionTime` fresh meanwhile.

### Q6 Isolation levels

Sync, non-default (default is read committed):
- Central pull snapshot: repeatable read, `CSM:571` via `transactions.ts:17-26`. Reason: LCK-27.
- Central lookup build: repeatable read, `CSM:350`. Writes inside it. With `FOR KEY SHARE` (`updateLookupTable.js:94-101`): a source row hard-deleted by a transaction that committed after this snapshot raises `40001` rather than resurrecting stale data. Not retried: the build aborts and the next scheduled run (every 20 s, `default.json5:263-266`) redoes it. `isConcurrentHardDeleteConflict` (`updateLookupTable.js:12-16`) downgrades the log to warn for any `40001` anywhere in the cause chain, not just hard deletes.
- Facility push snapshot: repeatable read, `packages/facility-server/app/sync/snapshotOutgoingChanges.js:52`. Comment 46-50: same child-without-parent reason; reads only.
- Facility bootstrap served by central: repeatable read, `buildFacilityBootstrap.js:79-90` ("one snapshot, as the outgoing sync snapshot is").
- Read only (read committed): `incomingSyncHook.ts:49` (`readOnlyTransaction`).
- Not sync: `SERIALIZABLE` in the importer, device registration, report version creation (`reportRoutes.js:256`, `createReportDefinitionVersion.js:29`); repeatable read in `migrateVitals/index.js:67`; read committed explicit in `ScheduledTaskState.ts:77, 129`.
- Mobile: none (local single-writer storage).

Session row outside the repeatable read transaction: confirmed (LCK-32). Serialization retries: none.

### Q7 Row-level locks that matter

- Clock row (`local_system_facts`, key `currentSyncTick`): written by `incrementValue` in every `tickTockGlobalClock` (blocks while another open transaction has written it), explicitly `FOR UPDATE` by imports (`importerEndpoint.js:100-103`). The trigger reads it without locking.
- Source rows during lookup build: `FOR KEY SHARE OF <table>` (`updateLookupTable.js:101`). It conflicts only with delete and key-changing updates, so ordinary updates do not block or fail; a delete waits for the build to finish.
- `sync_sessions` rows: updated on every poll (`CSM:244`), on completion and errors; `setParameters` writes with a plain `UPDATE` (`SyncSession.ts:55-65`). PR #7691 ("don't lock sync_sessions to write debug info", commit `b10c8de537`) split debug writes from business parameters: `addDebugInfo` was moved to a "drop it if contended" path and the business-logic values (`isMobile`, `tablesForFullResync`, `useSyncLookup`) went to `setParameters`. Intent per its comment (`SyncSession.ts:73-75`): "the SKIP LOCKED means we don't lock the sync_sessions table's row if it's already contended". Whether it does is unverified: the implementation is `findOne({ where: { id }, skipLocked: true })` with no `lock` option, and as far as I know Sequelize 6 only emits `SKIP LOCKED` together with a `FOR UPDATE` style lock clause (I could not read the installed Sequelize source because no `node_modules` is present in the worktree). If that is right, the `SELECT` takes no row lock and nothing is skipped; the following `session.update` is an ordinary `UPDATE` that waits for any row lock. Also `addDebugInfo` reads then rewrites the whole `debugInfo` object, so concurrent calls can overwrite each other.
- `local_system_facts` hold row (`FACT_SCHEDULED_TASK_HOLD_UNTIL`): `FOR SHARE` / `FOR UPDATE` in `ScheduledTaskState.ts:44-70`, a different row; unrelated to the clock.
- `SyncQueuedDevice` and `sync_sessions` capacity `UPDATE ... WHERE id` rows: plain updates (`startSnapshotWhenCapacityAvailable.js:15-19`).

### Other things a developer changing this area needs

- Pool pressure: each processing session pins a connection (Q4); each blocked tick-tock pins one; waiters on pending edits pin one each. Default pool max is 10 against two sessions per snapshot (LCK-09).
- `maxConcurrentSessions` and the cleaners are config, not settings; `llm/project-rules/settings.md` says new tuneables belong in settings.
- The two-flag rule (`-1` stored as `-999`, `0` re-queue) in the trigger is why a facility's incoming pull does not re-push what it received; incoming writes skip the lock entirely (`1793235590139-...ts:51-52`). The speaker's aside that a syncTrigger-disabled transaction would also work is right: the same function returns early when `syncTrigger = 'disabled'` (43-45), and migrations use that path (`packages/database/src/dataMigrations/index.js:13-15`).
- The `SyncLookupRefresher` task is guarded only by an in-process `isRunning` flag (`packages/shared/src/tasks/ScheduledTask.js:104-122`); no database lock stops two task processes running a build at once (inference: there is only one tasks process by deployment convention, not by lock).

## Unresolved

- Whether `skipLocked: true` without `lock` is a no-op in the installed Sequelize version. Next step: read `selectQuery` in `sequelize/lib/dialects/abstract/query-generator.js` from an installed copy, or log the SQL from `SyncSession.addDebugInfo` in a test.
- Whether the snapshot timeout's thrown error really terminates the process in production. Next step: set `snapshotTransactionTimeoutMs` low in a test and watch, or look for a process-level handler in the deployment wrapper.
- The importer `FOR UPDATE` vs open persist behaviour (Q3), and the over-capacity window in LCK-18. Next step: write a two-connection test for each.
- Whether the streaming settings path mismatch (LCK-19) is real at runtime. Next step: check what `ReadSettings.get` returns for an unknown path.
- Mobile's own 5-minute schedule and queue interaction was not checked; other ledgers or the mobile code cover it.
