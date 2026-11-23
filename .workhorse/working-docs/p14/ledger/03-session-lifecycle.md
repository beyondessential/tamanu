# Session lifecycle on central (SES)

Scope: the sync HTTP API, session start and preparation, connecting to a session, receiving pushed records into the snapshot table, and ending a session. Code is main at `22d3edaa36`. Paths are relative to the repository root. "Part 1" etc. are the transcript parts. Where I mention `origin/idempotent-delete`, that is an unmerged remote branch, read with `git diff`, not part of main.

## Drift

- SES-07 Snapshot tables are not temporary tables. They are ordinary tables in the `sync_snapshots` schema, named by session id, that persist until explicitly dropped.
- SES-09 "A bunch of TODO comments" about validation: there is exactly one (`packages/database/src/sync/saveIncomingChanges.ts:102`, and it is at persist time, not ingest). Ingest does validate two things (model exists, sync direction allows push), so "no validation at all" is slightly too strong. No record-shape validation exists, confirmed.
- SES-04 "The client says what tables it wants": true for mobile only. The facility server never sends `tablesToInclude`; central then uses every model.
- SES-20 "Apart from the advisory lock and creating a single table, the rest is background": the table is created in the background. Before the HTTP response only the advisory lock, a uuid and the `sync_sessions` insert happen.
- SES-21/SES-22 The "tick-tock blocks while another session persists" claim is still true as a side effect (row lock on `local_system_facts` inside the persist transaction), but the persist code comment now says concurrency control has moved to share advisory locks keyed by sync tick. So "we must start after any persist finishes" is outdated as a stated reason.
- SES-27 `connectToSession` is more than "exists plus last connection time": it also enforces error state, completed state and an optional timeout. It is called from nearly every per-session route.
- SES-28 There is no check that the connecting device is the device that started the session. Confirmed absent (answer to the transcript's open question).
- SES-33 "Generic sanitisation" in `insertSnapshotRecords` is only key snake-casing plus JSON stringifying two columns. No content sanitisation.
- SES-35 `sanitizeRecord` (`packages/database/src/sync/sanitizeRecord.ts`) is not applied to incoming pushes; it strips metadata columns on the outgoing side.
- SES-42 `DELETE /sync/:sessionId` is NOT idempotent on main. The idempotent version exists only on `origin/idempotent-delete`, not merged.
- SES-26 Streaming: not "unused", but off by default (`sync.streaming.enabled` false), used by facility servers only, never mobile. Additionally the central stream routes read two setting keys at paths that the schema does not declare, and `pull/stream` looks inconsistent with the cursor format (see SES-26).
- Startup log/response oddity: `POST /sync` responds with a `tick` field that is always undefined (SES-15 notes).

## Claims

### SES-01 Push happens before pull, and a failed pull does not undo a successful push
Source: Part 1 00:26:03 (and Part 3 00:43:28 for the independence point, outside my range)
Verdict: confirmed
Evidence: `packages/facility-server/app/sync/FacilitySyncManager.js:220-224` runs `pushChanges`, then `pullChanges`, then `endSyncSession`, in that order inside one try. Mobile does the same at `packages/mobile/App/services/sync/MobileSyncManager.ts:283-286`. Central persists the push in its own background step (`CentralSyncManager.js:737-807`) and marks `persistCompletedAt` before the client moves on.
Why: not stated in code; speaker says central must resolve conflicts before anything is pulled (Part 3 00:43:28).
Notes: Conflict resolution and the "abort if changed locally since push" rule (`assertIfPulledRecordsUpdatedAfterPushSnapshot`, default true in `packages/facility-server/config/default.json5`) belong to other ledgers; not checked here.

### SES-02 Central is relatively stateless, now holds a per-device record
Source: Part 1 00:27:10
Verdict: partly (outside my area; only the part touching sessions checked)
Evidence: `CentralSyncManager.js:782` writes `SyncDeviceTick` `{ deviceId, persistedAtSyncTick: tock }` inside the persist transaction, using the device id from the authenticated token (`buildSyncRoutes.js:361-364`). Session state itself is held in `sync_sessions` rows plus advisory locks, so central is not stateless between requests of one session.
Why: PR #11057 (commit `fc82834e0d`) "record the device tick inside the persist transaction". The validation that consumes `SyncDeviceTick` is another agent's area.
Notes: See `packages/central-server/__tests__/sync/CentralSyncManager.syncDeviceTick.test.js`.

### SES-03 Central keeps what is marked for sync; facility marks and pushes it
Source: Part 1 00:28:10
Verdict: unverifiable here (other ledger: marking patients for sync)
Evidence: see `specs/sync/marking-patients-for-sync.md`. The session-side evidence is that central builds `<sessionId>_full_sync_marked_for_sync_patients` and `..._regular_sync_...` tables from `patient_facilities` at pull setup (`packages/central-server/app/sync/createMarkedForSyncPatientsTable.js:3-33`, called at `CentralSyncManager.js:503-517`).

### SES-04 Clients declare which tables they want, rather than central deciding by client type
Source: Part 1 00:28:10, 00:29:43
Verdict: partly
Evidence: Mobile sends `tablesToInclude` on `pull/initiate` (`packages/mobile/App/services/sync/CentralServerConnection.ts:277-282`) and on `push/complete` (`:314-320`). The facility server sends neither: `startSyncSession`/`initiatePull` in `packages/facility-server/app/sync/CentralServerConnection.js:138-148,194-199` carry only `facilityIds`, `since`, `deviceId`, `urgent`, `lastSyncedTick`, and `completePush` carries only `deviceId`. Central treats a missing `tablesToInclude` as "all models" for pull (`CentralSyncManager.js:489-491`) and as `getModelsForPush(models)` for persist (`:746-748`).
Why: `inference`: the table list exists for mobile's staged upgrade resyncs (see SES-05); facility servers always want everything.
Notes: When `tablesToInclude` is given at persist, `filterModelsFromName` (`packages/central-server/app/sync/filterModelsFromName.js:1-6`) filters by table name and public schema only, not by sync direction. The direction gate for push is therefore only the ingest check (SES-31) in that case.

### SES-05 A client can request a full resync of one table
Source: Part 1 00:28:10, 00:29:43
Verdict: confirmed (mobile only)
Evidence: `tablesForFullResync` is passed from `pull/initiate` (`buildSyncRoutes.js:224-235`) into `setupSnapshotForPull`, which runs a third `snapshotOutgoingChanges` with `since = -1` over just those models (`CentralSyncManager.js:613-628`) and stores the list in session `parameters` (`:482-487`). Mobile reads it from a `tablesForFullResync` local system fact and deletes the fact after a successful pull (`MobileSyncManager.ts:389-400,550-551`). The facility server never sends it.
Why: code comment at `CentralSyncManager.js:613-614`: "used when mobile needs to wipe and resync tables as part of the upgrade process".
Notes: Central does not check that the requested subset is dependency-closed. The onus is on the client, as the speaker says.

### SES-06 Facility snapshots its own database in a repeatable-read transaction before pushing
Source: Part 1 00:30:57, 00:32:11
Verdict: confirmed, with the speaker's own later correction that the push set is held in memory
Evidence: `packages/facility-server/app/sync/snapshotOutgoingChanges.js:50-65` runs `findAll` per model in a `REPEATABLE_READ` transaction and returns a JS array. `FacilitySyncManager.js:304-316` pushes that array in pages via `pushOutgoingChanges` (`packages/facility-server/app/sync/pushOutgoingChanges.js:3-18`). No push snapshot table is created on the facility. The facility does create a `sync_snapshots` table for the *pull* side (`FacilitySyncManager.js:339`, `createSnapshotTable`), and drops all of them at the start of each sync (`:217`).
Why: code comment at `snapshotOutgoingChanges.js:46-49`: avoid a child record in the snapshot with its parent missing.
Notes: Central also uses repeatable read for its own pull snapshot (`CentralSyncManager.js:571-632`). Page size is adaptive (`calculatePageLimit.js`, aims at 2 s per page, starts at 10, max 10000).

### SES-07 Snapshot tables are temporary tables named by session id in `sync_snapshots`
Source: Part 1 00:32:11
Verdict: partly
Evidence: `packages/database/src/sync/manageSnapshotTable.ts:6,18-22,32-57`: schema constant `sync_snapshots`, table name `"sync_snapshots"."<sessionId>"`, created with plain `CREATE TABLE` (not `TEMP`, not `UNLOGGED`) with `autovacuum_enabled = off`. They survive connections and restarts until dropped (Q5). Session id is checked against `^[A-Za-z0-9-]+$` before use in raw SQL (`:8-15`).
Why: the regex comment says "be careful of SQL injection". Autovacuum is off because tables are short lived and bulk loaded; central runs `VACUUM (ANALYZE)` itself after the pull snapshot (`:126-130`, called at `CentralSyncManager.js:635`). `inference` for the autovacuum reason.
Notes: Two helper tables per session also live in the schema: `<id>_full_sync_marked_for_sync_patients` and `<id>_regular_sync_marked_for_sync_patients` (`manageSnapshotTable.ts:24-30`).

### SES-08 Incoming and outgoing snapshots are in the same schema; to check how they are told apart
Source: Part 1 00:33:17
Verdict: confirmed (answer: neither prefix, suffix nor separate schema: a `direction` column)
Evidence: `manageSnapshotTable.ts:40-41` `direction text NOT NULL`; values `'incoming'`/`'outgoing'` from `SYNC_SESSION_DIRECTION` (`packages/database/src/sync/constants.ts:100-103`). Both indexes lead with `direction` (`:54-55`). There is one table per session, not one per direction. On central "incoming" is what the client pushed and "outgoing" is what will be pulled; on a facility the table is reused with every pulled row marked `incoming` (`packages/facility-server/app/sync/pullIncomingChanges.js:56-58,100-104`).

### SES-09 Central ingests pushed records into the snapshot table without validating them; relies on database constraints at persist
Source: Part 1 00:33:17, 00:34:30
Verdict: partly (see question 4 below for the full account)
Evidence: ingest validates exactly two things: the record type maps to a known model (`CentralSyncManager.js:823-839`) and that model's `syncDirection` allows push (`:841-863`). Nothing checks `data` shape, required keys, id format, column types or foreign keys at ingest. The only TODO in this path is `packages/database/src/sync/saveIncomingChanges.ts:102`: `// validateRecord(data, null); TODO add in validation`, which sits in persist (`toRecordToWrite`), commented out, and `validateRecord` no longer exists anywhere in `packages/` (grep: only that comment). Per-model sanitisation at persist exists since PR #11730 (see SES-36).
Why: `git log -S` shows the TODO line came in with the very early sync work (commit `79997ea41f`); no reason recorded.
Notes: The snapshot table's own `NOT NULL` columns (`record_type`, `record_id`, `is_deleted`, `data`) are the only structural check at ingest, and a violation there surfaces as a database error from the bulk insert, not as a validation error.

### SES-10 After the last push, the client says it is done and central persists, with locking
Source: Part 1 00:35:22
Verdict: confirmed for the trigger; the locking detail is in another ledger
Evidence: `POST /sync/:sessionId/push/complete` (`buildSyncRoutes.js:358-367`) calls `completePush` (`CentralSyncManager.js:882-894`), which connects, takes the processing lock, and starts `persistIncomingChanges` without awaiting it.

### SES-11 `startSession` receives `facilityIds` (plural) because a server can host several facilities (an "omni server"); client also says if it is mobile
Source: Part 1 01:10:32, 01:11:45
Verdict: confirmed
Evidence: route body `{ lastSyncedTick, urgent, facilityIds, isMobile }` (`buildSyncRoutes.js:62`); empty or missing `facilityIds` throws `InvalidParameterError` (`:66-68`); `startSession({ userId, deviceId, facilityIds, isMobile })` stores `{ deviceId, facilityIds, isMobile }` in `parameters` (`CentralSyncManager.js:136,143`). Facility server sends `getServerFacilityIds()`, i.e. the configured list (`packages/facility-server/app/serverConfig.js:96-98`); mobile sends a single-element list (`CentralServerConnection.ts:233`).
Why: the "omni" naming is a project history anecdote, `unverifiable` in code.
Notes: Facility-server clients do not send `isMobile`, so it is absent from their `parameters`, and `isMobile` is read as falsy everywhere (`CentralSyncManager.js:562,722,755,892`).

### SES-12 Debug info is written to `sync_sessions` rather than relying on logs
Source: Part 1 01:11:45, 01:13:12
Verdict: confirmed, and split in two since PR #7710
Evidence: see question 6. `SyncSession.addDebugInfo` (`packages/database/src/models/SyncSession.ts:72-81`) and `setParameters` (`:55-64`).
Why: PR #7710 "Separate parameters from debugInfo": code was reading `debugInfo` for values that were really inputs to sync logic. Debug writes may skip a locked row, so they can be dropped; parameters must not be.

### SES-13 Mark-as-processing opens a transaction and takes `pg_advisory_xact_lock` keyed by session id; unmark commits it
Source: Part 1 01:13:12, 01:14:50
Verdict: confirmed
Evidence: `CentralSyncManager.js:277-293`: `sequelize.transaction()` (unmanaged), `SELECT pg_advisory_xact_lock(:sessionLockId)`, returns a function that commits. The key is `uuidToFairlyUniqueInteger(sessionId)` = first 12 hex chars of the uuid as a number (`packages/shared/src/utils/uuidToFairlyUniqueInteger.js:4-5`), a 48-bit value, so collisions between sessions are possible in principle but unlikely.
Notes: The transaction holds one database connection for as long as the lock is held. Test `CentralSyncManager.startSession.test.js:97` ("A large number of concurrent sessions will not consume the database connection pool") pins this.

### SES-14 The lock is inter-process communication ("is this session still working?"), not concurrency control
Source: Part 1 01:14:50
Verdict: confirmed
Evidence: code comment at `CentralSyncManager.js:278-283`: readable across processes in cluster mode, and cleared if the process dies (transaction rolls back). `checkSessionIsProcessing` (`:295-303`) runs `SELECT NOT(pg_try_advisory_xact_lock(:id))`: if it can take the lock it is not processing (and the lock is released straight away because the statement runs in autocommit). Used by `checkSessionReady`, `checkPullReady`, `checkPushComplete`, and `initiatePull` (to refuse a double initiate, `:310-315`, added after a v1.24 incident per the comment).
Notes: Because these are per-session locks keyed on the session id, the same mechanism is reused for three phases: preparation, pull snapshot and push persist. A session can only be in one of those at a time by client protocol; the code only enforces it for pull.

### SES-15 `startSession` creates the session, releases the lock and throws if creation fails, otherwise prepares and always releases
Source: Part 1 01:16:31
Verdict: confirmed
Evidence: `CentralSyncManager.js:136-184`. Order: (1) `generateDbUuid`; (2) `markSessionAsProcessing(sessionId)`; (3) `SyncSession.create({ id, startTime, lastConnectionTime: startTime, debugInfo, parameters })` in try/catch, on failure unmark and rethrow wrapped as "Failed to create sync session, server may be overloaded..."; (4) `prepareSession(syncSession).finally(unmarkSessionAsProcessing)` not awaited; (5) optional `await preparation` if `config.sync.awaitPreparation`; (6) log; (7) return `{ sessionId }`.
Why: the unlock-on-failure is PR #8275: failing to create the session used to leak the held connection, shrinking the pool until deadlock.
Notes: (a) `debugInfo` is whatever extra keys the caller passed, which from the route is just `{ userId }`. (b) The route returns `{ status: 'goodToGo', sessionId, tick }` (`buildSyncRoutes.js:146`) but `startSession` returns no `tick` (`:183`), so the `tick` key is dropped from the JSON. Clients fetch the tick separately (SES-18). (c) The session row insert is not inside the lock transaction (that transaction is unmanaged, so CLS does not bind it; `inference` from Sequelize CLS semantics), so other processes can see the row immediately.

### SES-16 Preparing creates the snapshot table, and waits for the lookup table's first build
Source: Part 1 01:16:31, 01:18:24
Verdict: confirmed, with a nuance on "always true now"
Evidence: `CentralSyncManager.js:186-198`: reads fact `FACT_LOOKUP_UP_TO_TICK`; if `config.sync.lookupTable.enabled` and the fact is nil, throws "Sync lookup table has not yet built. Cannot initiate sync."; then `createSnapshotTable`. `lookupTable.enabled` defaults to `true` in `packages/central-server/config/default.json5:58-62` but is a config key, not a hard-coded constant. This error does not reach the client at once: it is caught in `prepareSession` (SES-17).
Why: the reason for gating (speaker's guess about the first build not being transactional) is not in the code. See `specs/sync/lookup-table.md` and the lookup ledger. `inference`: initial build writes ticks from source tables and skips the pending-flag step (`:353-357`), so its content is not a coherent snapshot until done.
Notes: A missing fact is also treated as "not built", so a database restored without the fact blocks all syncs.

### SES-17 Background failures of preparation reach the client the next time it connects
Source: Part 1 01:34:04 (also asked about at 01:16:31)
Verdict: confirmed
Evidence: `prepareSession` catches everything, logs, and calls `SyncSession.markSessionErrored(id, message)` (`CentralSyncManager.js:206-209`); it does not rethrow, so `.finally(unmark)` runs normally. `markErrored` appends to `errors` and sets `completedAt` (`SyncSession.ts:93-103`). The client's next `GET /sync/:id/ready` calls `checkSessionReady` (`:653-671`): lock free, then `connectToSession`, which throws `Sync session '<id>' encountered an error: <last error>` (`:238-240`). Same path for `ready/stream`, which polls the same function and so also ends in an HTTP error mid-stream.
Why: `markSessionErrored` is also used for the "central restarted mid-preparation" case: if the lock is free but `startedAtTick` is still null, `checkSessionReady` records "Session initiation incomplete, likely because the central server restarted" (`:660-667`). Same pattern for pull (`:682-689`) and push (`:903-910`).
Notes: errors are truncated to 5000 chars and NUL bytes stripped (`SyncSession.ts:7,97`).

### SES-18 `tickTockGlobalClock` increments by two; central uses the tock, the client the tick; parity marks origin
Source: Part 1 01:18:24, 01:19:55
Verdict: confirmed (answers "start at zero or one")
Evidence: `CentralSyncManager.js:127-134`: `incrementValue(FACT_CURRENT_SYNC_TICK, 2)`, returns `{ tick: tock - 1, tock }`. The fact is seeded at `'1'` in `packages/database/src/migrations/000_baseline.sql:4739`. So the first session gets value 3: tick 2, tock 3. Ticks handed to clients are even, and the stored value (which central's triggers stamp onto central-made changes, `000_baseline.sql:1186`) is odd. Facility rows get even ticks by taking the central tick as their local clock (`FacilitySyncManager.js:292`).
Why: code comment at `CentralSyncManager.js:128-131`: guarantees the "tick" is unique to the requesting client and central-side direct changes (e.g. imports) are stamped at the tock, so a client at the same tick cannot miss them.
Notes: The odd/even parity only holds if nothing else writes the fact; a facility that was never synced still starts at 1 (odd).

### SES-19 `LocalSystemFact.incrementValue` is one query and needs no transaction
Source: Part 1 01:19:55, 01:21:10
Verdict: confirmed
Evidence: `packages/database/src/models/LocalSystemFact.ts:83-103`: single `UPDATE ... SET value = value::integer + :amount ... RETURNING value`. Throws if the fact row is missing. Row-level lock is held for the rest of any enclosing transaction (which is what makes SES-22 true).
Notes: `value::integer` means the clock overflows at 2^31 - 1; at two per session plus two or more per persist and lookup build this is far off but is a hard ceiling. `inference` on the practical horizon.

### SES-20 `awaitPreparation` exists only for unit tests; in real life awaiting would risk a query timeout, so everything except a couple of quick writes is in the background
Source: Part 1 01:21:10, 01:22:24
Verdict: partly
Evidence: `CentralSyncManager.js:166-175`. The `sync.awaitPreparation` config key does not appear in any `config/*.json5`; it is set only in tests (`__tests__/sync/CentralSyncManager.startSession.test.js:104`, `SyncQueuedDevice.test.js:86`, `gzippedPush.test.js:71`, `syncFacilityAccess.test.js:51`). What is synchronous before the HTTP response is: uuid generation, the advisory-lock transaction, and the `sync_sessions` insert. `createSnapshotTable` is inside `prepareSession` and so is in the background, contrary to the speaker's "creating a single table" being among the quick writes.
Why: code comment `:166-168`: `prepareSession` "(especially the tickTockGlobalClock action) might get blocked and take a while if the central server is concurrently persisting records from another client. Client should poll for the result later." The history is PR #3491 (commit `3a84716c66`, Feb 2023): tick-tocking waits behind a persisting push, which is intentional, and exceeded the HTTP request timeout. Before that the route awaited it.
Notes: Facility HTTP timeout is `sync.timeout` = 10000 ms (`packages/facility-server/config/default.json5:19`, used at `CentralServerConnection.js:41`); mobile default request timeout is 45 s (`mobile/.../CentralServerConnection.ts:88`), 5 min for pull pages (`:306`).

### SES-21 `startedAtTick` is stored on the session; the tock is discarded; wherever tick-tock appears it is for concurrency, not debugging
Source: Part 1 01:23:57
Verdict: partly
Evidence: `CentralSyncManager.js:196-197`: `const { tick } = await this.tickTockGlobalClock(); await syncSession.markAsStartedAt(tick);` (tock discarded here). `startedAtTick` is what the client uses as its new local clock (served by `GET /:id/metadata`, `buildSyncRoutes.js:184-191`, or the stream `END` message). The blanket "tick-tock is always for concurrency" is not a safe rule: at `:763` the comment says the persist tick-tock "is now purely for saving with a unique tick"; at `:339` (lookup build) and `:467` (pull snapshot) the tick is a "safe up-to" mark.
Why: comment at `CentralSyncManager.js:758-762`.

### SES-22 Tick-tock may take long because something holds a lock on the sync tick fact
Source: Part 1 01:25:11, 01:26:42
Verdict: confirmed as mechanism; the stated reason is partly outdated
Evidence: persist runs inside `sequelize.transaction` and calls `tickTockGlobalClock` first and last (`CentralSyncManager.js:752-788`), so the `local_system_facts` row for the clock stays row-locked until that transaction commits; any other `UPDATE` of the same row (every session start, every pull snapshot) waits. That is what PR #3491 describes. The comment at `:758-762` says concurrency control "is now handled by shared advisory locks taken using the current sync tick as the id, which are waited on by an exclusive lock taken prior to starting a snapshot" (`waitForPendingEdits`, `:436-447`, `getSyncTicksOfPendingEdits.ts`).
Why: the speaker could not recall why the start tick must be after a persist; from the comment, the modern guarantee is the advisory-lock wait, with the row lock as a remaining side effect (`inference`).

### SES-23 `POST /sync` closes stale sessions for the device
Source: Part 1 01:27:55
Verdict: confirmed
Evidence: `buildSyncRoutes.js:72-97` finds sessions with `completedAt IS NULL` and `parameters.deviceId = device.id` and calls `completeSyncSession(store, id, 'Session marked as completed due to its device reconnecting')`. Because an error string is passed, these are marked errored, so their snapshot tables are kept for the 24 h retention (Q5), not dropped.
Why: speaker says sessions live in client memory so a restart forgets the session (`inference`; consistent with the code). A time-based sweeper also exists: `StaleSyncSessionCleaner` (`packages/central-server/app/tasks/StaleSyncSessionCleaner.js`, default `staleSessionSeconds: 3600`, every minute) closes sessions with no connection for an hour, also as errored.

### SES-24 Central queues devices, keeps position, and remembers urgency
Source: Part 1 01:27:55, 01:28:59
Verdict: confirmed
Evidence: `SyncQueuedDevice.checkSyncRequest` (`packages/database/src/models/SyncQueuedDevice.ts:60-98`) upserts the queue row keyed by device id, updates `lastSeenTime`, sets `urgent: urgent || queueRecord.urgent` and `lastSyncedTick`, and returns the head of the queue, ordered `urgent DESC, lastSyncedTick ASC` among rows seen in the last 5 minutes (`:9,42-58`). If the head is not this device the route answers `{ status: 'waitingInQueue', behind }` (`buildSyncRoutes.js:109-115`). The row is deleted just before the session is created (`:137`).
Why: comment `buildSyncRoutes.js:132-136`: an errored session leaves the device at the back of the queue, but its old `lastSyncedTick` gives it priority again once the error clears.
Notes: Facility sync "now" is the `/sync/run` route with `urgent: true` (`packages/facility-server/app/routes/apiv1/sync.js:20-24`); scheduled syncs are `*/1 * * * *` (`facility-server/config/default.json5:11`). Mobile "sync now" calls `triggerUrgentSync`, which re-requests urgently every 10 s by default (`setting SYNC_URGENT_INTERVAL_IN_SECONDS`, `MobileSyncManager.ts:164-185`) so it keeps its place in the queue. I did not find the mobile 5-minute scheduled interval; unverifiable here. Also `buildSyncRoutes.js:105` has a leftover `log.warn('DEBUG device=...')` on every request.

### SES-25 Capacity check, then a create-session advisory lock, then start
Source: Part 1 01:30:01, 01:31:40
Verdict: confirmed
Evidence: capacity: `getIsSyncCapacityFull` counts sessions with `completedAt` and `errors` both null against `config.sync.maxConcurrentSessions` (default 4) (`CentralSyncManager.js:116-125`); full gives `{ status: 'activeSync' }` (`buildSyncRoutes.js:118-122`). Lock: `takeCreateSessionLock` uses a non-blocking `pg_try_advisory_xact_lock` on `stringToStableInteger('createSessionAdvisoryLock')` in its own transaction (`:91-114`); a failed try also answers `activeSync` (`buildSyncRoutes.js:124-129`), it does not wait. The lock is released in a `finally` after `startSession` returns (`:147-149`), which is before background preparation finishes.
Why: PR #9181 (commit `8743d7c0ae`): without it two requests can both see spare capacity and create sessions together, exceeding the limit. The speaker's reconstruction is right.
Notes: A session counts toward capacity from the moment its row exists, including while preparing. `activeSync` and `waitingInQueue` and `centralWaking` (client-synthesised from a 503, `facility-server/.../CentralServerConnection.js:138-151`) all mean "no session id": both clients treat that as queued.

### SES-26 There is a streaming mechanism; not used anywhere yet; option to wait for readiness as a stream
Source: Part 1 01:31:40
Verdict: partly
Evidence: see question 8 in full. Stream variants: `GET /:id/ready/stream`, `GET /:id/pull/ready/stream`, `GET /:id/pull/stream` (`buildSyncRoutes.js:194,253,305`). Facility servers use them when the login response says `settings.sync.streaming.enabled` (`facility-server/.../CentralServerConnection.js:125-127,162,204`, and `FacilitySyncManager.js:339-342`). The setting is `sync.streaming.enabled`, default `false` (`packages/settings/src/schema/central.ts:231-239`). Mobile never uses streaming.
Notes: Two defects visible by reading (not run): (1) the routes read `sync.databasePollInterval` and `sync.databasePollBatchSize` (`buildSyncRoutes.js:207,266,320`) but the schema declares them as `sync.streaming.databasePollInterval` / `sync.streaming.databasePollBatchSize`. `ReadSettings.get` is a plain path lookup (`packages/settings/src/reader/ReadSettings.ts:59-61`), so the routes get `undefined`: `sleepAsync(undefined)` is an immediate re-poll, and an undefined limit falls back to `Number.MAX_SAFE_INTEGER` (`findSyncSnapshotRecords.ts:60`). (2) `pull/stream` passes the numeric `id` of the last row back as `fromId` (`buildSyncRoutes.js:319,331`), but `getOutgoingChanges` expects the base64 `{ sortOrder, id }` cursor the polling client builds (`findSyncSnapshotRecords.ts:63,72-77`; `pullIncomingChanges.js:44`), and `streamIncomingChanges` does not delete `sortOrder` before inserting (`pullIncomingChanges.js:99-103`, whereas the polling path does at `:50`), which the snapshot table has no column for. Both landed together in PR #7983 and no test exercises `pull/stream`. Treat the streaming pull path as untested and probably broken until run.

### SES-27 `connectToSession` checks the session exists and writes the last connection time; also used as a liveness signal
Source: Part 1 01:33:07
Verdict: partly (full account in question 3)
Evidence: `CentralSyncManager.js:220-252`.

### SES-28 Do we check a different device cannot connect to the same session?
Source: Part 1 01:34:04
Verdict: wrong (the second speaker's belief), confirmed absent
Evidence: question 3. No handler compares `device.id` with `session.parameters.deviceId`. `git grep` for "device" mismatch in `packages/central-server/app/sync` and `__tests__/sync` finds only the body-vs-token check at `buildSyncRoutes.js:44-49`.

### SES-29 Errors from background work are detected at the next connect
Source: Part 1 01:34:04, 01:35:08
Verdict: confirmed
Evidence: see SES-17. `connectToSession` throws if `session.errors` is set (`:238-240`).

### SES-30 `addIncomingChanges` builds a model map; maybe a cache, maybe a plain lookup
Source: Part 1 01:35:08
Verdict: confirmed (both are true)
Evidence: `CentralSyncManager.js:809-820`: a private field built lazily once per `CentralSyncManager` instance (so effectively a cache), as a `Map` from `tableName` to model, filtered by `m.tableName && m.usesPublicSchema`, used for O(1) lookup in the loop at `:822-823`.
Why: the `usesPublicSchema` filter excludes models living in other schemas such as `logs.*` so a client cannot push into them (`inference`; the failure path is "unknown model", `:824-839`).

### SES-31 Ingest checks each record has a model and the model allows push; throwing in the loop rather than filtering the model map
Source: Part 1 01:36:34
Verdict: confirmed
Evidence: `CentralSyncManager.js:822-864`. The allowed directions are `PUSH_TO_CENTRAL`, `PUSH_TO_CENTRAL_THEN_DELETE`, `BIDIRECTIONAL`, the same set as `getModelsForPush` (`packages/database/src/sync/getModelsForDirection.ts:21-25`). On either failure it: logs at error ("Sync security violation: ..."), adds `rejectedRecord: { type, id }` to debug info, calls `markSessionErrored`, and throws a plain `Error` (so the client sees a 500 from the push request, and the session is dead). The whole batch is validated before anything is inserted, so a bad record rejects the entire page. Pinned by `__tests__/sync/CentralSyncManager.syncDirection.test.js:48,103`.
Why: speaker's reason (clearer to throw in one explicit place) is a style choice, `unverifiable`. The "two places" he mentions are ingest and `getModelsForPush` at persist.

### SES-32 Changes are turned into incoming snapshot records and inserted
Source: Part 1 01:36:34
Verdict: confirmed
Evidence: `CentralSyncManager.js:866-879`: spreads each change, adds `direction: 'incoming'` and `updatedAtByFieldSum` (sum of `data.updatedAtByField` values, or null), then `insertSnapshotRecords`.
Notes: `c.data.updatedAtByField` dereferences `data` without a guard, so a change with no `data` throws a `TypeError` (500, session not marked errored). The sum is used later to detect field changes between merge and save (`manageSnapshotTable.ts:47`).

### SES-33 `insertSnapshotRecords` lives in `manageSnapshotTable`; generic sanitisation only, no model-specific sanitisation
Source: Part 1 01:38:02
Verdict: partly
Evidence: `manageSnapshotTable.ts:102-110` is `records.map(r => stringifyJsonAttributes(snakeKey(r)))` then one `queryInterface.bulkInsert`. `snakeKey` renames keys to snake_case (`:84-85`); `stringifyJsonAttributes` JSON-encodes `data` and `changelog_records` so arrays are not turned into PostgreSQL array literals (`:87-100`). Unknown keys are not stripped, so an extra top-level key on a pushed change makes the insert fail on a missing column.
Why: the doc comment at `:91-95` explains the JSON handling.
Notes: "batch by batch" is driven by the client: one insert per `POST /push` request, whose size is the client's adaptive page (`pushOutgoingChanges.js`), bounded by the 50 MB body limit (`packages/central-server/app/createApi.js:99`). Mobile gzips push bodies (`mobile/.../CentralServerConnection.ts:183-196`, PR #10795); body-parser inflates them.

### SES-34 Hot path maps over the changes twice
Source: Part 1 01:39:24
Verdict: confirmed
Evidence: one map at `CentralSyncManager.js:866`, a second inside `insertSnapshotRecords` (`manageSnapshotTable.ts:108`), plus the validation loop (`:822`): three passes. Not pursued (performance claim about cache locality is unverifiable and not code-relevant).

### SES-35 Generic sanitisation here
Source: Part 1 01:38:02
Verdict: partly
Evidence: `sanitizeRecord` (`packages/database/src/sync/sanitizeRecord.ts:5-10`) drops `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick` (`constants.ts:105-110`). It is used when *building* outgoing records (facility `snapshotOutgoingChanges.js:25`, `resolveDuplicatedPatientDisplayIds.ts:57`, `resolveAppointmentSchedules.ts:60`), not when ingesting pushes. Ingested `data` is stored verbatim; persist-time handling is `Model.sanitizeForCentralServer` (SES-36) and `saveChangesForModel` stripping `deletedAt` (`saveIncomingChanges.ts:34-43`).

### SES-36 Validation of pushed records beyond the above
Source: not in the transcript range; see question 4.
Verdict: n/a (new)
Evidence: question 4.

### SES-37 Persisting after push-complete: marks the session processing, client polls
Source: Part 1 01:40:37
Verdict: confirmed
Evidence: `completePush` `CentralSyncManager.js:882-894`; `persistIncomingChanges(...).finally(unmark)`; first statements are `countSyncSnapshotRecords(..., INCOMING)` and `addDebugInfo({ beganPersistAt, totalPushed })` (`:737-744`). Client: `completePush` posts then `pollUntilTrue('sync/<id>/push/complete')` (`facility-server/.../CentralServerConnection.js:240-250`), every second for up to 12 hours (`packages/api-client/src/TamanuApi.ts:638-660`; mobile `CentralServerConnection.ts:325-336`).
Why: same reason as SES-20 (HTTP timeouts); comment at `:885-886`.
Notes: warning at `:801-802`: any new DB call after `persistCompletedAt` is set must move it, because `checkPushComplete` treats a free lock plus null `persistCompletedAt` as a crash.

### SES-38 Persist: persisted-at sync tick, audit paused for non-mobile, mobile uses normal triggers for logs.changes
Source: Part 1 01:42:18
Verdict: partly (persist internals are another agent's area)
Evidence: `CentralSyncManager.js:752-788`. Audit paused when `!isMobile` (`:755-757`). The tock is not "returned from the transaction": it is used as `savedAtSyncTick` on the incoming snapshot rows (`:775-780`) and written to `SyncDeviceTick` (`:782`).

### SES-39 Client polls `GET push/complete` while central persists
Source: Part 1 02:08:10, 02:09:58
Verdict: confirmed
Evidence: `buildSyncRoutes.js:370-378` returns `checkPushComplete` (`CentralSyncManager.js:896-914`): false while the lock is held, true after, and an error (and an errored session) if the lock is free but `persistCompletedAt` is null.

### SES-40 At any point the client can post that the sync errored
Source: Part 1 02:09:58
Verdict: confirmed
Evidence: `POST /:sessionId/error` with body `{ error: string }` (zod, `buildSyncRoutes.js:380-394`) calls `endSession(sessionId, error)`. Facility server: reports only errors that happened locally, not ones that carried an HTTP response from central (`FacilitySyncManager.js:229-234`, PR #8768). Mobile: reports every failure, best effort (`MobileSyncManager.ts:286-287,306-316`).
Notes: central also reads the existing error state first (`endSession` calls `connectToSession`), so reporting an error on an already-errored or already-completed session returns a 500, not success.

### SES-41 On success the client does not post "complete"; it sends DELETE on the session id
Source: Part 1 02:09:58
Verdict: confirmed
Evidence: `DELETE /:sessionId` (`buildSyncRoutes.js:396-405`) calls `endSession(sessionId)` with no error. Facility `endSyncSession` (`CentralServerConnection.js:190-192`), mobile (`:262-264`). The verb is a misnomer for what it does (completes, does not delete; the row and, per Q5, sometimes the tables stay).

### SES-42 The delete endpoint was made idempotent
Source: Part 3 00:01:10
Verdict: outdated / not on main
Evidence: on main, a second DELETE hits `endSession` -> `connectToSession`, which throws `Sync session '<id>' is already completed` (`CentralSyncManager.js:241-243`). The idempotent version is on `origin/idempotent-delete` (unmerged; commits `c3e50680db`, `4431bfb393`, `62dc586ba6` and merges): `endSession` first looks for an already-ended session and returns without changes (logging a warning), ignoring a later error report too; `connectToSession` no longer stamps a timeout on a session that already completed; both `DELETE` and `POST /error` return `204`. Tests added there: `CentralSyncManager.endSession.test.js`, `endSession.route.test.js`, `connectToSession.test.js`.
Why: the stated motivation (mobile loses connectivity, a retry after a lost response must not fail) matches the branch's comments.
Notes: that branch changes the response body from `{}` to an empty `204`; clients that parse JSON on success should be checked.

## Open questions answered

### Q1. Every sync route

All mounted at `/api/sync` (`packages/central-server/app/buildRoutes.js:36`). Every route first passes the router middleware at `buildSyncRoutes.js:38-52`: requires an authenticated `req.device` (set from the access token by `userMiddleware.js:33-35`), requires scope `SYNC_CLIENT`, and rejects a body `deviceId` that differs from the token's device id (a body `deviceId` is deprecated and logged as a warning). No route checks that the session belongs to this device.

| Method and path | Lines | What it does | Returns immediately, work continues in background? | What the client does next |
| --- | --- | --- | --- | --- |
| `POST /` | 55-151 | Validates facilities and user, closes the device's stale sessions, updates the queue, checks capacity and the create-session lock, creates the session | Yes for preparation: responds `goodToGo` with `sessionId` while `prepareSession` runs. Otherwise answers `waitingInQueue` or `activeSync` with no session | On `goodToGo`: poll `GET /:id/ready` (or stream), then fetch the tick. Otherwise retry on the next schedule (or every 10 s on mobile urgent) |
| `POST /bootstrap` | 155-170 | Serves the records a new facility needs before first sync completes; no session | No, synchronous | Used once by a facility server (`fetchBootstrap`) |
| `GET /:id/ready` | 173-181 | `checkSessionReady`: false while preparing, true when done, error if the session errored | n/a (the poll target) | Poll once per second until truthy |
| `GET /:id/metadata` | 184-191 | Returns `{ startedAtTick }` | No | Read once after ready (polling mode) |
| `GET /:id/ready/stream` | 194-217 | Same as ready, as a framed stream; ends with `END { startedAtTick }` | Holds the connection open, writes `SESSION_WAITING` every `databasePollInterval` | Reads until `END` (stream mode only) |
| `POST /:id/pull/initiate` | 220-238 | Parses `since`, `facilityIds`, `tablesToInclude`, `tablesForFullResync`; `initiatePull` | Yes: starts `setupSnapshotForPull` unawaited and replies `{}` | Poll `GET /pull/ready` or stream |
| `GET /:id/pull/ready` | 242-250 | `checkPullReady` | n/a (poll target) | Poll every second |
| `GET /:id/pull/ready/stream` | 253-276 | Same as pull ready, as a stream; ends with `END { totalToPull, pullUntil }` | Holds open, writes `PULL_WAITING` | Reads until `END` |
| `GET /:id/pull/metadata` | 279-286 | `{ totalToPull, pullUntil }` (also records `totalToPull` in debug info) | No | Read once (polling mode) |
| `GET /:id/pull` | 289-302 | One page of outgoing snapshot rows, ordered by dependency, `fromId` cursor, `limit` default 100 | No | Repeat until empty or `totalToPull` reached |
| `GET /:id/pull/stream` | 305-342 | Same rows streamed as `PULL_CHANGE` messages then `END` | Streams for the length of the pull | Reads until `END`; resume with `fromId` (see SES-26 defects) |
| `POST /:id/push` | 345-355 | Validates and inserts pushed records into the snapshot table | No, synchronous | Repeat per page, then push/complete |
| `POST /:id/push/complete` | 358-367 | Marks session processing and starts `persistIncomingChanges` unawaited | Yes | Poll `GET /push/complete` |
| `GET /:id/push/complete` | 370-378 | `checkPushComplete` | n/a (poll target) | Poll every second |
| `POST /:id/error` | 384-394 | Records a client-reported error via `endSession(id, error)` | No | Client rethrows its own error |
| `DELETE /:id` | 397-405 | `endSession(id)`: completes the session and drops its tables | No | Done |

Poll cadence and limits: `TamanuApi.pollUntilOk` polls every second for up to 12 h (`packages/api-client/src/TamanuApi.ts:638-660`); mobile has its own copy with the same numbers.

### Q2. Order of operations in `startSession` and `prepareSession`

Before the HTTP response (`POST /` handler then `startSession`):
1. Router middleware: device, scope, body `deviceId` match (`buildSyncRoutes.js:38-52`).
2. `facilityIds` non-empty (`:66-68`); `assertUserCanSyncFacilities`: `User.canSync` (setting `auth.restrictUsersToSync`, permission `sync` on `Facility`, `User.ts:304-318`) and `canAccessFacility` for each id (`:18-28`, `:70`).
3. Close this device's unfinished sessions as errored (`:72-97`).
4. `SyncQueuedDevice.checkSyncRequest`; return `waitingInQueue` if not head (`:100-115`).
5. `getIsSyncCapacityFull` then `takeCreateSessionLock`; return `activeSync` if either blocks (`:118-129`).
6. Delete the queue row (`:137`).
7. `startSession`: uuid, `markSessionAsProcessing`, insert `sync_sessions` row (`CentralSyncManager.js:141-164`).
8. Kick off `prepareSession` unawaited (`:169`); return `{ sessionId }`; route responds `goodToGo` and releases the create-session lock (`buildSyncRoutes.js:139-149`).

In the background (`prepareSession`, `:186-210`):
1. Read `FACT_LOOKUP_UP_TO_TICK`; error if lookup enabled and unset.
2. `createSnapshotTable`.
3. `tickTockGlobalClock` (can wait behind a persist transaction).
4. `markAsStartedAt(tick)` writes `started_at_tick`.
5. Set OpenTelemetry attributes.
6. `.finally` commits the lock transaction, so the session now reads as "not processing".

`awaitPreparation` (`:173-175`): test-only switch that awaits the preparation promise inside `startSession` so tests can assert on the finished state and do not leak background work between cases. No production config sets it.

Background failure path: `prepareSession` catches, logs, `markSessionErrored` (appends to `errors`, sets `completedAt`) and swallows. The client sees it as an error response from its next `GET /ready` (or mid-stream) via `connectToSession`. If the process dies instead, the transaction rolls back, the lock frees, `startedAtTick` is null, and `checkSessionReady` converts that into a "likely because the central server restarted" error (`:660-667`). The same two-step pattern protects pull (`checkPullReady`) and push (`checkPushComplete`).

### Q3. Everything `connectToSession` checks and writes (`CentralSyncManager.js:220-252`)

Checks, in order:
1. Row exists, else `Error("Sync session '<id>' not found")` (plain error, so a 500).
2. If `config.sync.syncSessionTimeoutMs` is set (default `null`, so off) and the session has no errors and `updatedAt - createdAt > syncSessionTimeoutMs`, mark it errored "timed out". Note it measures row `updatedAt` minus `createdAt`, and `updatedAt` moves on every connection write, so it measures time between creation and the last write, not wall time since creation. `origin/idempotent-delete` adds a `!completedAt` guard here because ending a session moved `updatedAt` and let a later request time out a cleanly ended session.
3. If `errors` is set, throw `Sync session '<id>' encountered an error: <last error>`.
4. If `completedAt` is set, throw "is already completed".

Writes: `session.update({ lastConnectionTime: Date.now() })` (this also bumps `updated_at`), plus the timeout `markErrored` write when it fires. It sets OpenTelemetry span attribute `app.sync.sessionId`. It returns the session row.

Called from: `addIncomingChanges`, `completePush`, `initiatePull`, `setupSnapshotForPull`, `checkSessionReady`, `checkPullReady`, `checkPushComplete`, `fetchSyncMetadata`, `fetchPullMetadata`, `getOutgoingChanges`, `endSession`. Not from `POST /`, `POST /bootstrap` or `sessionExists`.

Device match: there is no check that the connecting device equals the device that started the session. The device id exists in three places: the JWT access token (`deviceId` claim, parsed in `packages/database/src/models/User.ts:536-541` and the `Device` row loaded at `:559-564`, which throws `InvalidTokenError('Device does not exist')`), `req.device` set by `userMiddleware.js:33-35`, and `sync_sessions.parameters.deviceId` written at start from that same `device.id` (`buildSyncRoutes.js:141`). The only validation of the device id is: it must exist in the token and the database, it must carry the `SYNC_CLIENT` scope, and any body `deviceId` must equal it (`buildSyncRoutes.js:38-52`). `parameters.deviceId` is read back only for stale-session cleanup, logging and the admin sync list. Per-session routes use `device.id` only for `SyncDeviceTick` (`push/complete`, `:364`) and `pull/initiate` (`:234`, passed down to outgoing snapshotting). Consequence worth knowing: any authenticated sync-scoped device that learns a session uuid can drive that session. Session ids are random v4 uuids, which limits exposure. Also `pull/initiate` takes `facilityIds` from the request body and does not re-run the facility access check nor compare them with the facilities declared at start (see Q9).

### Q4. Validation of pushed records on the way in

At ingest (`addIncomingChanges`, `CentralSyncManager.js:810-880`):
- Session connect checks (Q3).
- Each `change.recordType` must match a model with a `tableName` in the public schema (`:814-839`), else session errored with "Sync security violation: Attempted to push record with unknown model".
- Model `syncDirection` must be push, push-then-delete or bidirectional (`:841-863`), else "Sync security violation: Attempted to push record that is not allowed to be pushed". Both add a `rejectedRecord` to the session debug info and log at error with the record type and id but not the record body.
- Nothing else: `change.recordId`, `isDeleted`, and `data` are not checked, `data.id` is not compared with `recordId`, there is no per-model schema check, no foreign key check, no size check beyond the 50 MB body limit.

At persist (other ledger, summarised only because the question asks about PR #11730 and follow-ups): `saveChangesForModel` (`packages/database/src/sync/saveIncomingChanges.ts:25-44`) calls `model.prepareSanitizeContext(changes, sessionId)` once per batch and `model.sanitizeForCentralServer(data, context)` per record. Defaults are no-ops (`packages/database/src/models/Model.ts:196-211`). Implementations exist for `PatientCommunication`, `ReportRequest`, `Attachment` and `Asset`. PR #11730 (commit `03ada26569`, "validate external-effect sync pushes"; follow-ups #11764 and #11769) added the two that matter for external effects:
- `PatientCommunication.sanitizeForCentralServer` (`packages/database/src/models/PatientCommunication.ts:73-85`) drops any pushed `attachment` and, for email channels, stores a non-email destination as `BAD_FORMAT` with error "Invalid destination address"; the senders re-check the address at send time and only send attachments that central generated in its own directory (`packages/central-server/app/tasks/BaseCommunicationProcessor.js`, `app/utils/files.js`).
- `ReportRequest.prepareSanitizeContext`/`sanitizeForCentralServer` (`ReportRequest.ts:153-227`) reduce recipients to `{ email: [...] }`, reject anything else with status `ERROR` and "Invalid recipients", and refuse the request unless the named requester can use at least one of the facilities in the session's `parameters.facilityIds` and may run that report. Without a context the request is refused.
- Spec: `specs/sync/pushed-records.md` (id `PUSH`) says exactly this, scoped to communications and report requests. It says nothing about ingest-time validation or general record shape, and it states a known limit in the PR body (a request may still name a user who can access every facility).
- Tests: `packages/database/__tests__/sync/pushedRecordsOnCentral.test.ts`, `packages/central-server/__tests__/tasks/PatientEmailCommunicationProcessor.test.js`.

Confirm or refute "no validation of record shape; database constraints at persist time are the safety net": confirmed as to record shape in general; refuted as "no validation" overall (ingest has two checks and four models sanitise at persist). Relevant TODO text: `// validateRecord(data, null); TODO add in validation` at `packages/database/src/sync/saveIncomingChanges.ts:102`. It is the only validation-related TODO in `packages/central-server/app/sync`, `packages/database/src/sync` or the facility sync code (`rg -i "todo|validat"`). Other TODOs in the area are unrelated (`buildSyncRoutes.js:323` "change this to a cursor").

### Q5. Snapshot tables

- Name: `"sync_snapshots"."<sessionId>"` (`manageSnapshotTable.ts:6,18-22`). Companion tables `"sync_snapshots"."<sessionId>_full_sync_marked_for_sync_patients"` and `"..._regular_sync_marked_for_sync_patients"` (`:24-30`).
- Columns (`:39-53`): `id BIGSERIAL PK`; `direction text NOT NULL`; `record_type text NOT NULL` (the source table name); `record_id text NOT NULL`; `is_deleted boolean NOT NULL`; `data json NOT NULL`; `saved_at_sync_tick bigint` (compare incoming and outgoing within one session); `updated_at_by_field_sum bigint` (detect field changes during merge/save); `sync_lookup_id bigint`; `changelog_records json`; `requires_repull boolean DEFAULT false`. Indexes `<name>_dir_id_idx (direction, id) INCLUDE (record_type)` and `<name>_dir_rec_id_idx (direction, record_type, id)`. `autovacuum_enabled = off`. `record_id` was changed to TEXT by PR #9953.
- Incoming vs outgoing: the `direction` column (Q8 of the transcript, SES-08).
- Created: central, in `prepareSession` (`CentralSyncManager.js:195`), so before the first push; the marked-for-sync helper tables at pull setup (`:503-517`). Facility: `pullChanges` (`FacilitySyncManager.js:338`).
- Dropped, happy path: `completeSyncSession` drops the snapshot table and both helper tables immediately and sets `snapshot_dropped_at` (`packages/database/src/sync/completeSyncSession.ts:15-17`), i.e. on `DELETE /:id`.
- Dropped, error path: `completeSyncSession` with an error calls `markErrored` and returns, leaving tables in place (`:9-12`). `SnapshotTableCleaner` (`packages/central-server/app/tasks/SnapshotTableCleaner.js`) later drops them: criteria `completed_at < now - retentionHours`, `errors IS NOT NULL`, `snapshot_dropped_at IS NULL` (`:30-36`); config `schedules.snapshotTableCleaner` (`packages/central-server/config/default.json5:254-262`): runs every minute between 01:00 and 05:59 server local time, `retentionHours: 24`, `batchSize: 1000`, 100 ms between drops (so a batch takes about 100 s). It sets `snapshot_dropped_at` for the ones it dropped; a failed drop is logged and retried next run. A partial index `sync_sessions_pending_snapshot_cleanup_idx` supports it (migration `1776908908321-addSnapshotDroppedAtToSyncSessions.ts`, which also backfills nothing: it only adds the column and index).
- Why (PR #9646, commit `1575d5e99a`): `markErrored` used to leave tables forever because most error paths bypass `completeSyncSession`; one on-premises deployment reached about 190k orphan tables and hundreds of GB. Errored tables are kept 24 h on purpose, as debugging evidence.
- Not covered by either: sessions that are never marked errored or completed (for example a central crash before the session row exists cannot produce a table, but a crash after creation leaves the table until `StaleSyncSessionCleaner` marks the session errored after an hour, then the cleaner reaps it). Test: `packages/central-server/__tests__/tasks/SnapshotTableCleaner.test.js`.

### Q6. `sync_sessions` columns

Current definition: baseline `packages/database/src/migrations/000_baseline.sql:4046-4063`, plus `snapshot_dropped_at` (migration `1776908908321`) and time indexes (`1784601600000-addSyncSessionsTimeIndexes.ts`). Model: `SyncSession.ts:25-48`; direction `DO_NOT_SYNC`.

| Column | Meaning and who writes it |
| --- | --- |
| `id` uuid | session id, also the snapshot table name and the advisory lock key |
| `created_at`, `updated_at`, `deleted_at` | row metadata; `updated_at` moves with every write including each connection |
| `start_time` | JS clock at the start of `startSession` (`:142,149`) |
| `last_connection_time` | initially `start_time`; overwritten by every `connectToSession`; used by `StaleSyncSessionCleaner` |
| `snapshot_started_at` | set by `startSnapshotWhenCapacityAvailable` when the pull snapshot is allowed to start (`startSnapshotWhenCapacityAvailable.js:5-30`, limit `numberConcurrentPullSnapshots`) |
| `snapshot_completed_at` | set when the pull snapshot finished (`CentralSyncManager.js:640`) |
| `persist_completed_at` | set when pushed records are persisted (`:796-799`) |
| `completed_at` | set by `completeSyncSession` (success) or by `markErrored` (error), so errored sessions are also "completed" (`SyncSession.ts:99-102`) |
| `snapshot_dropped_at` | set when the snapshot tables were dropped (happy path or cleaner) |
| `started_at_tick` | tick from preparation (`markAsStartedAt`) |
| `pull_since`, `pull_until` | the `since` the client asked for and the tick the snapshot is up to (`:477-480`) |
| `errors` text[] | appended by `markErrored`, max 5000 chars each |
| `debug_info` json | best-effort diagnostics, see below |
| `parameters` jsonb NOT NULL | inputs that sync logic reads back, see below |

`debug_info` contents written today: at start `{ userId }` (`buildSyncRoutes.js:140`, anything extra passed to `startSession`), `totalToPull` (`fetchPullMetadata`, `:708`), `beganPersistAt` and `totalPushed` (`:744`), and `rejectedRecord { type, id }` on an ingest rejection (`:833,857`). `addDebugInfo` re-reads the row with `skipLocked` and merges; if the row is locked the write is silently dropped (also logged at debug) (`SyncSession.ts:72-81`). `parameters` contents: `deviceId`, `facilityIds`, `isMobile` at start; `minSourceTick`, `maxSourceTick`, `tablesForFullResync`, `useSyncLookup` at pull setup via `setParameters`, a single SQL `parameters || $data::jsonb` update (`:55-64`, `CentralSyncManager.js:482-487`). Read back: `isMobile` (changelog attach, audit pause, lab requests), `minSourceTick`/`maxSourceTick` (changelog), `facilityIds` (report-request validation, logs), `deviceId` (stale-session query, logs, admin list).

PR #7710 (commit `518be20de0`) did this split. Old sessions may still hold these keys in `debug_info`; the admin last-completed query (`packages/central-server/app/admin/sync.js:50-90`) coalesces both places. Related: that query counts any session with `completed_at` set, including errored ones.

### Q7. How a session ends

- `DELETE /sync/:sessionId` -> `endSession(sessionId)` -> `connectToSession` (so it throws if the session is errored, completed or missing) -> `completeSyncSession(store, id, undefined)`: loads the row, sets `completedAt = now`, saves, drops the snapshot and marked-for-sync tables, sets `snapshotDroppedAt` (`completeSyncSession.ts:4-18`); logs `completedSession` with duration, facilities and device.
- Idempotent? Not on main (SES-42). A repeat DELETE returns an error because `connectToSession` rejects a completed session. `origin/idempotent-delete` would make a repeat a no-op returning 204.
- Error report: `POST /sync/:sessionId/error` `{ error }` -> `endSession(id, error)` -> `completeSyncSession(..., error)` -> `session.markErrored(error)` only; the snapshot tables stay for the cleaner. Logged at error level. The idempotency branch also makes a late error on an ended session a no-op.
- Other ways a session ends: any internal failure calls `markSessionErrored` (preparation, pull setup, persist, ingest rejection, restart detection, timeout); the stale cleaner and the device reconnect step close open sessions with an error string.
- A session never records "success" separately from `completed_at` with `errors` null.

### Q8. Streaming

- Endpoints with streaming variants: session ready, pull ready, pull data (SES-26 and the route table). Push and the other calls have none.
- Frame format (`packages/central-server/app/sync/StreamMessage.js:3-27`, constants `packages/constants/src/sync.ts:18-28`): `CR LF` (2 bytes), `kind` uint16 BE, `length` uint32 BE, then `length` bytes of JSON. Kinds: `END 0xf001`, `SESSION_WAITING 0x0001`, `PULL_WAITING 0x0002`, `PULL_CHANGE 0x0003`. Response is `200`, `Content-Type: application/json+frame`, chunked. The reader is `TamanuApi.stream` (`packages/api-client/src/TamanuApi.ts:660+`): a stream without an `END` message is treated as truncated and restarted, up to 10 attempts 10 s apart, re-calling the endpoint function so a `fromId` can resume.
- Who uses them: facility servers, when central's login response carries `settings.sync.streaming.enabled` true (`CentralServerConnection.js:125-127`); `startSyncSession`, `initiatePull` and `pullChanges` choose between poll and stream on that flag (`:162,204`; `FacilitySyncManager.js:339-342`). Setting `sync.streaming.enabled` defaults to `false`, is `exposedToWeb`, and sits under the `highRisk` `sync` group (`packages/settings/src/schema/central.ts:221-251`). Mobile: no stream call sites; `CentralServerConnection.ts` only polls (`:252,288,327`). So today streaming is off unless an operator enables it, and then only facility servers stream. Defects: SES-26. Errors raised after `startStream` has written the headers cannot become an HTTP status; they end the stream without `END`, which the client reads as a truncated stream and retries.

### Q9. What the client declares

- Session start `POST /sync`: `facilityIds` (array), `deviceId` (deprecated body field; real id from token), `urgent`, `lastSyncedTick` (for queue ordering), `isMobile` (mobile sets true; facility omits).
- `pull/initiate`: `since`, `facilityIds` (again), `tablesToInclude` (mobile only), `tablesForFullResync` (mobile only), `deviceId` (deprecated, validated by the router middleware).
- `push/complete`: `tablesToInclude` (mobile only), `deviceId`.
- Not declared per session: urgent applies only at start; there is no per-pull urgency. Tables-for-full-resync is mobile only.
- Omni server: the facility server sends all configured facility ids (`serverConfig.js:96-98`). Central authorises each one at session start (`assertUserCanSyncFacilities`), stores the list in `parameters.facilityIds`, uses the body's list at pull setup for marked-for-sync tables, `PatientFacility` counts and the lab-request setting (`CentralSyncManager.js:495-535`), and refuses a session whose facilities span more than one sensitive network (`:537-556`, `specs/sync/sensitive-networks.md`). One snapshot, one session, one device serves all of them. The pull-time list is not rechecked against the user or against the start-time list (see Q3 note); the report-request validation uses the start-time list.

### Q10. Request-size and timing behaviour

- Why background: client HTTP timeouts (facility `sync.timeout` 10 s; mobile default 45 s) versus work that can wait behind another session's persist (the clock row lock, SES-22), build a big snapshot, or persist a big push. Three spots use the same pattern: `startSession` (PR #3491), `initiatePull` (`:318`, comment "it takes a while - the sync client will poll"), `completePush` (`:885-886`).
- Settings and config that matter (all in `packages/central-server/config/default.json5:45-63` unless noted): `maxConcurrentSessions` 4, `numberConcurrentPullSnapshots` 4, `syncSessionTimeoutMs` null (off), `snapshotTransactionTimeoutMs` null (off; when set it throws from a bare `setTimeout`, so it is not a clean abort, `CentralSyncManager.js:573-577`), `persistedCacheBatchSize`, `pauseBetweenPersistedCacheBatchesInMilliseconds`, `lookupTable.enabled`. Loadshedder queue `low_priority` for `/api/sync` (4 active, 8 queued, 7.5 s queue timeout, `:64-93`), so under load sync requests can be shed with an error before reaching the handler. Body size limit 50 MB (`createApi.js:99`). Facility `sync.dynamicLimiter` (initial 10, max 10000, aims at 2 s per page). Streaming poll settings under `sync.streaming` (SES-26 mismatch). Poll loops: 1 s, up to 12 h.
- `StaleSyncSessionCleaner` (default every minute, `staleSessionSeconds` 3600) is the backstop for clients that vanish.

## Not in the transcript

- Router-level auth for sync: only an authenticated device with `SYNC_CLIENT` scope may call any sync route (`buildSyncRoutes.js:38-52`; scope enforced by `Device.ensureHasScope`, `Device.ts:105-109`). Body `deviceId` is deprecated: `log.warn('Providing deviceId in the request body is deprecated')`.
- A sync user must pass `User.canSync` (only enforced when setting `auth.restrictUsersToSync` is on) and `canAccessFacility` for every id, at session start and bootstrap only (spec link: `specs/sync/bootstrap.md`; test `__tests__/sync/syncFacilityAccess.test.js`).
- Ingest rejections throw a plain `Error` after marking the session errored, so the client sees a generic 500 and then errors on the next connect. Facility servers treat an error response from central as "do not report" (SES-40), which is fine because central already knows.
- `endSession` is also the error reporting path, so it throws for an already-ended session in both directions on main.
- `getIsSyncCapacityFull` loads all active session rows (`findAll`) just to count them.
- Leftover debug log in `POST /` (`buildSyncRoutes.js:105`, `log.warn('DEBUG ...')`) writes at warn for every request.
- `StaleSyncSessionCleaner.run` uses `select: ['id']` (not a Sequelize option) with `raw: true`, so it actually loads whole rows; it then reads `session.startTime` and `session.parameters` from the raw row, which works only because of that (`StaleSyncSessionCleaner.js:36-53`).
- Mobile does not drop its local snapshot until after a successful end (`MobileSyncManager.ts:291-292`); a failed mobile sync leaves it, and the facility drops all snapshot tables at the start of the next sync (`FacilitySyncManager.js:217`).
- Sensitive-network and `syncAllLabRequests` decisions are made at pull setup from the body's `facilityIds`, not the session's.
- `SyncSession` rows are never deleted by code (a "paper trail", comment in `completeSyncSession.ts:5-7`).
- Facility-side "centralWaking" and queue states are handled in `specs/sync/waking-central.md` (SYNCHK), not by central; a waking central answers `503` with `Retry-After` before any session logic runs.

## Unresolved

- The mobile scheduled sync interval (transcript says 5 minutes): not located. Look at where `MobileSyncManager` is started in `packages/mobile/App/ui` and in the `mobileSync` settings (`packages/settings/src/schema/central.ts:256+`).
- Whether `pull/stream` actually fails after the first batch: I read it against the cursor format and the snapshot columns but did not run it. A one-off run with `sync.streaming.enabled` on would settle SES-26.
- Whether session-device binding or `pull/initiate` facility re-checking has been discussed or is intended; nothing in code or specs says. Look for issues referencing "sync session device" in the trackers.
- Whether `SyncDeviceTick` is read for a "facility restored from backup" check (SES-02): other ledger; `docs/runbooks/facility-restored-from-backup.md` is the starting point.
- The reason for the lookup-table-first-build gate (SES-16): only a guess; see the lookup ledger and `specs/sync/lookup-table.md`.
- Merge status of `origin/idempotent-delete` and whether clients tolerate an empty `204` body: check the PR on that branch.
