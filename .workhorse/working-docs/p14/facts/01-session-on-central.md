# One sync session as central sees it

Code at `22d3edaa36`. `CSM` = `CentralSyncManager` in `packages/central-server/app/sync/CentralSyncManager.js`. Routes: `packages/central-server/app/sync/buildSyncRoutes.js`, mounted at `/api/sync`. Tick facts: `tickTockGlobalClock` adds 2 to `currentSyncTick`, returns `{ tick: tock - 1, tock }`; clients get the (even) tick, central stamps its own writes with the (odd) tock, so no two parties share a time [SES-18, CLK-01].

## 1. Routes

Every route first requires an authenticated device with scope `SYNC_CLIENT` and a body `deviceId` (deprecated) equal to the token's. No route checks that the session belongs to the calling device [SES-28, Q1].

| Route | `CSM` function | Returns before work is done? | Client afterwards |
| --- | --- | --- | --- |
| `POST /` | `startSession` (via capacity and queue checks) | Yes: `goodToGo` + `sessionId` while `prepareSession` runs. Else `waitingInQueue` / `activeSync`, no session [SES-24, SES-25] | Poll `GET /:id/ready`, then `GET /:id/metadata`. No session: retry next schedule (mobile urgent: every 10 s) |
| `POST /bootstrap` | none (`buildFacilityBootstrap`) | No; no session | Used once by a new facility |
| `GET /:id/ready`, `/ready/stream` | `checkSessionReady` | Poll target. Stream ends with `END { startedAtTick }` | Poll 1 s, up to 12 h [SES-26] |
| `GET /:id/metadata` | `fetchSyncMetadata` | No | Reads `startedAtTick` |
| `POST /:id/push` | `addIncomingChanges` | No, synchronous insert into snapshot | One request per page |
| `POST /:id/push/complete` | `completePush` | Yes: `persistIncomingChanges` unawaited | Poll `GET /:id/push/complete` |
| `GET /:id/push/complete` | `checkPushComplete` | Poll target | Poll 1 s |
| `POST /:id/pull/initiate` | `initiatePull` | Yes: `setupSnapshotForPull` unawaited, replies `{}` | Poll `GET /:id/pull/ready` (or stream) |
| `GET /:id/pull/ready`, `/pull/ready/stream` | `checkPullReady` | Poll target. Stream ends `END { totalToPull, pullUntil }` | Poll 1 s |
| `GET /:id/pull/metadata` | `fetchPullMetadata` | No | Reads `{ totalToPull, pullUntil }` |
| `GET /:id/pull?fromId=&limit=` | `getOutgoingChanges` | No; one page (limit default 100) | Repeat until `totalToPull` or empty page |
| `GET /:id/pull/stream` | `getOutgoingChanges` in a loop | Streams the whole pull as `PULL_CHANGE` frames then `END` | Read to `END` |
| `POST /:id/error` | `endSession(id, error)` | No | Rethrows its own error |
| `DELETE /:id` | `endSession(id)` | No | Done |

- Streaming variants exist for session ready, pull ready and pull data only. Off by default (`sync.streaming.enabled` false), used by facility servers only, never mobile. Frame: CRLF, kind uint16, length uint32, JSON; `END` required or the client treats the stream as truncated [SES-26, Q8].
- Streaming defects found by reading, not run: the routes read `sync.databasePollInterval`/`databasePollBatchSize` but the schema declares them under `sync.streaming`; `pull/stream` passes a numeric row id as `fromId` where `getOutgoingChanges` expects a base64 `{ sortOrder, id }` cursor, so the second batch probably throws. No test covers it. `inference` [SES-26, PLL-15]
- Why background: client HTTP timeouts (facility `sync.timeout` 10 s, mobile 45 s) versus work that can wait behind another session's persist. Same pattern at start, initiate pull, complete push. PR #3491 [SES-20, Q10].
- `DELETE /:id` is not idempotent on main: a repeat throws "already completed". An idempotent version (204) exists only on unmerged `origin/idempotent-delete` [SES-42].

## 2. The sequence

1. **Request a session** (`POST /`). Checks: `facilityIds` non-empty; `assertUserCanSyncFacilities` (`User.canSync`, `canAccessFacility` per id); the device's unfinished sessions are closed as errored ("device reconnecting"). No tick [SES-23, Q2].
2. **Queue and capacity**. `SyncQueuedDevice.checkSyncRequest` upserts the queue row; non-head devices get `waitingInQueue`. Then `getIsSyncCapacityFull`, then `takeCreateSessionLock` (non-blocking `pg_try_advisory_xact_lock`); either failing gives `activeSync`. The queue row is deleted just before the session is created [SES-24, SES-25].
3. **`startSession`**: uuid; `markSessionAsProcessing` (opens an unmanaged transaction holding `pg_advisory_xact_lock` on the session id); insert `sync_sessions` row (on failure unmark and rethrow, PR #8275); start `prepareSession` unawaited; return `{ sessionId }`; the route releases the create-session lock. Only these happen before the HTTP response [SES-13, SES-15, SES-20].
4. **`prepareSession`** (background): read `FACT_LOOKUP_UP_TO_TICK`, error if lookup enabled and unset; `createSnapshotTable`; `tickTockGlobalClock` (can wait behind a persist) and keep the tick as `started_at_tick` (the client's new local clock; tock discarded); `.finally` commits the lock transaction. Errors are caught and `markSessionErrored`, surfacing at the client's next `ready` [SES-16, SES-17, SES-21].
5. **`checkSessionReady`**: lock held means false. Lock free but `started_at_tick` null means central restarted: records an error. Else `connectToSession`, true [SES-17].
6. **Receive pushed pages** (`addIncomingChanges`): see section 4. Rows go into the snapshot table with `direction = 'incoming'`. No tick [SES-32].
7. **`completePush`**: `connectToSession`, mark processing, start `persistIncomingChanges` unawaited. Client polls `checkPushComplete`: lock held false; lock free and `persist_completed_at` null is a crash, so error [SES-37, SES-39].
8. **`persistIncomingChanges`** (background, exact order):
   1. Count incoming rows; write `beganPersistAt`, `totalPushed` to debug info. Not transactional.
   2. Pick models: `tablesToInclude` (mobile) or `getModelsForPush`.
   3. Open one `sequelize.transaction` (READ COMMITTED, `inference`); CLS carries it everywhere.
   4. If not mobile, `pauseAudit`.
   5. `tickTockGlobalClock`; keep only the tock T. Every row written in the transaction is stamped T by trigger. The tick half is thrown away.
   6. `incomingSyncHook` for each model that has one (section 6).
   7. `withDeferredSyncSafeguards(saveIncomingChanges(..., isCentralServer = true))` (section 5).
   8. `updateSnapshotRecords`: set `saved_at_sync_tick = T` on all incoming rows (read by `removeEchoedChanges`).
   9. `SyncDeviceTick.create({ deviceId, persistedAtSyncTick: T })`, inside the transaction so rows and attribution commit together (PR #11057; before, a crash in the gap made a device repull everything it had pushed).
   10. Second `tickTockGlobalClock`, result ignored: current tick becomes T+2 so later edits (`adjustDataPostSyncPush`) cannot share T and are pulled in the same session.
   11. Commit. A persist consumes four ticks.
   12. `adjustDataPostSyncPush` per model that has it (`Encounter`, `FacilitySettingMigration`), batched by `sync.adjustDataBatchSize`, outside any transaction, at T+2.
   13. `bumpSyncTickForRepull` (section 6).
   14. Set `persist_completed_at`. Any new DB call must go before this, or `checkPushComplete` misreads a crash.
   15. Any error: log, `markSessionErrored`. Work committed at step 11 is not undone if 12 to 14 fail. [SES-38, PSH Q1, PSH-16]
9. **Initiate pull** (`initiatePull`): `connectToSession`, refuse if already processing (guard added after an incident, per code comment), mark processing, start `setupSnapshotForPull` unawaited, reply `{}`. Client polls `checkPullReady` (same free-lock-but-`snapshot_completed_at`-null crash check) [PLL-14].
10. **`setupSnapshotForPull`** (background, exact order):
    1. `connectToSession`.
    2. `startSnapshotWhenCapacityAvailable`: poll every 500 ms until `snapshot_started_at` can be set while fewer than `sync.numberConcurrentPullSnapshots` (4) sessions are mid-snapshot.
    3. `tickTockGlobalClock`; keep the tick T1. It is `pullUntil`, the tick waited on, and the tick returned to the client: one tick, not two.
    4. `waitForPendingEdits(T1)`: waits on advisory share-lock holders (pushes mid-write) with a tick below T1.
    5. `getLookupSourceTickRange(since, T1)` from `sync_lookup_ticks`; computed once, used later to attach changelog.
    6. Write `pull_since`, `pull_until`; write `parameters` (`minSourceTick`, `maxSourceTick`, `tablesForFullResync`, `useSyncLookup` which nothing reads).
    7. `modelsToInclude` = `tablesToInclude` or every model.
    8. Count `patient_facilities` with tick above `since`; create the full and regular marked-for-sync tables (section 7).
    9. Read `sync.syncAllLabRequests` from the `settings` table for the session's facilities; resolve sensitive networks (more than one throws); build `sessionConfig`. Lab flag applies only if not mobile and `since > -1`.
    10. Open `repeatableReadTransaction` (a `SELECT 1` first so the snapshot starts at once); arm `sync.snapshotTransactionTimeoutMs` timer if set.
    11. Pass A: full pass, `since` -1, full table, patient-linked models only, config reduced to `{ sensitiveNetworkId }`.
    12. Count all marked rows for the facilities.
    13. Pass B: incremental pass, `since`, regular table, all pull models, full config.
    14. Pass C (mobile only, when `tablesForFullResync` given): `since` -1 over just those models.
    15. `removeEchoedChanges`.
    16. Commit.
    17. `VACUUM (ANALYZE)` the snapshot table, outside the transaction.
    18. Set `snapshot_completed_at`, outside the transaction.
    19. `finally`: clear timer, release lock. Errors: `markSessionErrored`.
    - Reason for repeatable read: avoid a child in the snapshot with its parent missing (code comment). Reason for the vacuum: mark pages all-visible so page reads use index-only scans (comment); autovacuum is off on these tables (reason `inference`). Reason session updates sit outside the transaction: `connectToSession` updates `last_connection_time` on every poll and repeatable read can fail with a serialisation error otherwise (comment). [PLL-26a, PLL-37, PLL-38]
    - Passes A, B, C each use `snapshotOutgoingChanges`: lookup path (`sync.lookupTable.enabled`, default true) copies from `sync_lookup` with `INSERT ... SELECT`, chunked by `id`; the model path (config false, test default) builds per-model filters. `record_type IN`, `updated_at_sync_tick > :since`, `data IS NOT NULL`, scope clause (facility or sensitive network), and with `avoidRepull` (default true) `pushed_by_device_id <> :deviceId OR NULL` [PLL-39, PLL-52, PLL-56].
    - No query bounds the snapshot above `pullUntil`: newer rows visible at snapshot start are sent and sent again next time [PLL-30].
    - A record in two passes appears twice in the snapshot (deduped on the facility's save) `inference` [PSH-29].
11. **Serve pages** (`getOutgoingChanges`): read a page ordered by model dependency rank then snapshot `id`, cursor is base64 `{ sortOrder, id }`; unless mobile or no tick range, attach `changelogRecords` from `logs.changes` where tick between `minSourceTick` and `maxSourceTick`, in batches of 10,000. `totalToPull` is the outgoing count after echo removal [PLL-63].
12. **End**: `DELETE /:id` calls `endSession` then `completeSyncSession`: `connectToSession` (throws if errored, completed, missing), set `completed_at`, drop the snapshot and both marked tables, set `snapshot_dropped_at`. `POST /:id/error` instead calls `markErrored` only, leaving tables for the cleaner [Q7].
- Push always precedes pull on both clients; a failed pull does not undo a persisted push, and the client's push cursor is already written [SES-01, PLL-07].

## 3. What the client declares

| Field | Sent at | Facility server | Mobile |
| --- | --- | --- | --- |
| `facilityIds` | start and `pull/initiate` | Configured list (can be several) | One id |
| `isMobile` | start | Not sent (read as false) | `true` |
| `urgent`, `lastSyncedTick` | start (queue order only) | Sent | Sent |
| `deviceId` | body deprecated; real value from token | Token | Token |
| `since` | `pull/initiate` (must parse as number) | `lastSuccessfulSyncPull` fact, default -1 | Same fact name |
| `tablesToInclude` | `pull/initiate`, `push/complete` | Never | Sent |
| `tablesForFullResync` | `pull/initiate` | Never | Sent (staged upgrade resync) |
- Missing `tablesToInclude` means all models for pull and `getModelsForPush` for persist. With it, `filterModelsFromName` filters by table name and public schema only, not direction, so the ingest check is the only push-direction gate then. `inference` on why: the list exists for mobile upgrades [SES-04, SES-05].
- `pull/initiate` takes `facilityIds` from the body and does not re-check user access or compare with the start-time list; report-request validation uses the start-time list. Sensitive-network and lab-flag decisions use the pull-time list [Q3, Q9].
- Central does not check a requested full-resync subset is dependency-closed; onus on the client [SES-05].

## 4. Validation and sanitisation of pushed records

- Ingest (`addIncomingChanges`) validates the whole page before inserting anything: each `recordType` maps to a model with a public-schema table (`usesPublicSchema`, so no `logs.*`), and the model's `syncDirection` is push, push-then-delete or bidirectional. Failure: log at error ("Sync security violation"), add `rejectedRecord { type, id }` to debug info, `markSessionErrored`, throw plain `Error` (client sees 500; session dead) [SES-30, SES-31].
- Not checked at ingest: `data` shape, `recordId` against `data.id`, id format, types, foreign keys, size beyond the 50 MB body limit. Only the snapshot table's NOT NULL columns apply, surfacing as a database error. An unknown top-level key makes the bulk insert fail on a missing column. A change with no `data` throws a `TypeError` (500, session not errored) [SES-09, SES-32, SES-33].
- Ingest transform: spread each change, add `direction: 'incoming'` and `updatedAtByFieldSum` (sum of `data.updatedAtByField` values or null); `insertSnapshotRecords` snake-cases keys and JSON-stringifies `data` and `changelog_records`. `sanitizeRecord` (drops `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`) is for outgoing records, not pushes [SES-35].
- Model sanitisers run at persist: `prepareSanitizeContext(changes, sessionId)` once per batch, then `sanitizeForCentralServer(data, context)` per record (default identity, `Model`). `deletedAt` is stripped afterwards.
  - `PatientCommunication`: drops pushed `attachment`; non-email destination on email channel stored `BAD_FORMAT`.
  - `ReportRequest`: recipients reduced to `{ email: [...] }`; refused (`ERROR`) unless requester can run the report and use a facility of the session's `parameters.facilityIds`.
  - `Attachment` (base64 to Buffer); `Asset` (central variant only for manual insert). Facility-side: `Asset`, `ReferenceDrugFacility` (strips stock fields when mSupply stock-on-hand is on).
  - Reason (PR #11730, spec `PUSH`): pushes could trigger external effects (email, reports). The only validation TODO (`// validateRecord ... TODO`) is dead and commented out [SES-36, PSH Q8].

## 5. Saving pushed records

- `saveIncomingChanges` (shared with the facility): models in `sortInDependencyOrder` (non-self belongs-to; no cycle guard); per model, batches of `persistedCacheBatchSize` (20000) by snapshot `id` cursor, 50 ms pause between batches; per batch extract changelog, `saveChangesForModel`, insert changelog [PSH-24].
- Classification uses `findByIds(ids, false)` (paranoid off, soft-deleted count as existing) [PSH-27]:
  - Create: id not existing. Update: id exists, including deletes and restores.
  - Delete: existing live and incoming `isDeleted`; or a create where any copy is deleted (created and soft-deleted in one INSERT).
  - Restore: facility only, existing deleted and incoming not. Both deleted: nothing. Central never restores.
  - The decision rides on the record as `deletedAt` (`now()`, `null`, or absent), so `deleted_at` is written in the same statement. Client `deletedAt` is discarded. Reason (PR #11055): separate destroy/restore left the sync tick out, so a facility re-pushed central's own deletes. Records are filtered on `data.id`; nobody knows why (PR #4854 thread) [PSH-28, Q6].
- Creates: `uniqBy` id then `bulkCreate({ hooks: false })`. Updates: on central each is merged with the existing row by `mergeRecord`, delete/restore decision re-applied after the merge, then `model.update` via `asyncPool` of `persistUpdateWorkerPoolSize` (5), writes limited to model attributes, `id` stripped.
- Conflicts on central: record level, last pushed wins, no tick compared. Field level only when both sides carry `updatedAtByField` (only `patient_additional_data`): per-field higher tick wins, ties keep existing, whole JSON values [PSH-01, PSH-07, PSH-09, Q4].
- `hooks: false`: Sequelize ORM hooks would trigger side effects that may violate other records in the same payload (code comment, PR #9711). DB triggers still fire (sync tick, changelog, `updated_at_by_field`) [PSH-30].
- `withDeferredSyncSafeguards`: inside the transaction, `SET CONSTRAINTS ... DEFERRED` for deferrable FK and unique constraints in `public` (not the changelog triggers), then `IMMEDIATE` in `finally` so violations surface before commit. Reason: self-referencing FKs and unique constraints mid-batch (examples `tasks.parent_task_id`, `invoice_payments.original_payment_id`). Not about `logs.changes` [PSH-23].
- Changelog: a facility's `logs.changes` rows arrive on each record as `changelogRecords`, are stripped and bulk-inserted with `ignoreDuplicates`.
- Audit pause: for non-mobile pushes `audit.pause` stops `logs.record_change()` so the facility's own rows are not doubled. Mobile keeps no changelog, so triggers write it, with `updated_by_user_id` = nil uuid because persist never sets a user. `isMobile` comes from session `parameters` [PSH-15].

## 6. Incoming sync hooks and repull

- Hooks (`incomingSyncHook`) exist on `Patient` and `AppointmentSchedule` only. They change data: they rewrite the incoming snapshot (insert and update rows), which `saveIncomingChanges` then writes [PSH-18, PSH-21].
  - `Patient` (`resolveDuplicatedPatientDisplayIds`): case-insensitive display id clash with an existing patient: existing becomes `<id>_duplicate_1`, incoming `<id>_duplicate_2`. Does not detect two clashes inside one push (`inference`). PR #7055.
  - `AppointmentSchedule` (`resolveAppointmentSchedules`): for a pushed `cancelledAtDate`, uncancelled appointments starting after `generatedUntilDate` are soft deleted.
- Runner: batches of `sync.incomingSyncHookBatchSize` (20000) by id cursor; hook runs in a read-only sub-transaction (sees committed data only, `inference` on connection); results inserted/updated with `requiresRepull: true` (the runner sets it). Models visited in `Object.values(models)` order [PSH-19].
- Getting changes back: `bumpSyncTickForRepull`, after commit, runs `UPDATE <table> SET updated_at_sync_tick = 1` for rows flagged `requires_repull`; `1` is a throwaway the trigger overwrites with the current tick (T+2). That tick has no `sync_device_ticks` row, so `pushed_by_device_id` is NULL and the avoid-repull filter lets the row go back to the pusher. Lost if the server dies between commit and bump (flag lives only in the snapshot table), but the session then errors [PSH Q2].
- `adjustDataPostSyncPush` (different hook) writes at T+2 and also returns to the pusher [CLK-10].
- Echo prevention: `removeEchoedChanges` deletes an outgoing row matching an incoming row on type, id, `saved_at_sync_tick` and `updated_at_by_field_sum`. Runs unconditionally but on the lookup path essentially never matches (lookup ticks are tick halves, persist ticks are tocks, opposite parity). Real mechanism is `pushed_by_device_id` via `sync_device_ticks` (PR #6545). Model path relies on it [PLL-34, PLL-36].
- Known gap (verdict `broken` with default settings, `inference` from reading, no test): a `patient_additional_data` row merged field by field on central is stamped T and attributed to the pushing device, so it is excluded from that device's pull; nothing flags it for repull [PSH Q7].

## 7. Snapshot tables

- Not temporary: ordinary tables `"sync_snapshots"."<sessionId>"`, created `CREATE TABLE` with `autovacuum_enabled = off`; survive restarts until dropped. Session id is regex-checked (`^[A-Za-z0-9-]+$`) before use in raw SQL [SES-07].
- One table per session; incoming and outgoing are told apart by a `direction` column (`'incoming'`/`'outgoing'`). Indexes `(direction, id) INCLUDE (record_type)` and `(direction, record_type, id)` [SES-08].
- Columns: `id` bigserial PK; `direction`; `record_type` (source table name); `record_id` text (PR #9953); `is_deleted`; `data` json; `saved_at_sync_tick`; `updated_at_by_field_sum` (detect field changes during merge and save); `sync_lookup_id` (outgoing, source lookup row); `changelog_records` json; `requires_repull` default false (incoming only) [Q5].
- Marked-for-sync helper tables: `<sessionId>_full_sync_marked_for_sync_patients` and `<sessionId>_regular_sync_marked_for_sync_patients`, in the same schema, `CREATE TABLE AS SELECT patient_id FROM patient_facilities`, no index, created at pull setup (step 10.8) outside the transaction. Full = `facility_id IN (:facilityIds) AND updated_at_sync_tick > :since` ("newly marked"); regular = the complement (`<= :since`). Any later tick bump on a `patient_facilities` row makes the patient "new" again `inference` [PLL-03, PLL-22].
- Created: snapshot table in `prepareSession`, before the first push. Dropped: on clean end by `completeSyncSession`. Errored sessions keep them as debugging evidence [SES-07, Q5].
- `SnapshotTableCleaner`: drops tables where `completed_at < now - retentionHours` (24), `errors IS NOT NULL`, `snapshot_dropped_at IS NULL`. Runs every minute 01:00 to 05:59 server local time, batch 1000, 100 ms between drops; failed drops retry. Reason (PR #9646): `markErrored` left tables forever, one deployment reached about 190k orphans and hundreds of GB. Sessions never marked errored are first closed by `StaleSyncSessionCleaner` [Q5].

## 8. The `sync_sessions` row

| Column | Meaning |
| --- | --- |
| `start_time`, `last_connection_time` | Start, then overwritten by every `connectToSession`; stale cleaner reads it |
| `started_at_tick` | Written at end of prepare |
| `snapshot_started_at`, `snapshot_completed_at` | Pull snapshot allowed to start, finished |
| `pull_since`, `pull_until` | Client's `since`; T1 |
| `persist_completed_at` | Push persisted |
| `completed_at` | Set on clean end and by `markErrored`; errored sessions are also "completed" |
| `snapshot_dropped_at` | Tables dropped |
| `errors` text[] | Appended by `markErrored`; 5000 chars each, NULs stripped |
| `debug_info` | Best effort: `userId`, `totalToPull`, `beganPersistAt`, `totalPushed`, `rejectedRecord`; write skips a locked row so can be dropped |
| `parameters` jsonb | Inputs read back: `deviceId`, `facilityIds`, `isMobile`, then `minSourceTick`, `maxSourceTick`, `tablesForFullResync`, `useSyncLookup`; one SQL merge |

- `debug_info` and `parameters` were split by PR #7710: code was reading logic inputs from debug data, and debug writes may be dropped while parameters must not be [SES-12, Q6].
- Errors reach the client only at its next poll: background code calls `markSessionErrored` and never throws to the request; the next `ready`/`pull/ready`/`push/complete` runs `connectToSession`, which throws "encountered an error: <last error>". Crash detection: free lock plus the expected "done" column null records "likely because the central server restarted" [SES-17, SES-29].
- `connectToSession`, in order: row exists; if `sync.syncSessionTimeoutMs` set (default off) and `updatedAt - createdAt` exceeds it, mark errored; throw if `errors`; throw if `completedAt`. Then update `last_connection_time`. Called by every per-session route; not by `POST /`, bootstrap. No device-to-session binding exists: any sync-scoped device knowing a session uuid can drive it [SES-28, Q3].

## 9. Capacity and queue

- `sync.maxConcurrentSessions` (4, config): sessions with `completed_at` and `errors` both null count from the moment the row exists, including preparing. `numberConcurrentPullSnapshots` (4) separately gates step 10.2 [SES-25].
- Create-session lock exists so two requests cannot both see spare capacity (PR #9181). It is non-blocking, so losing returns `activeSync`; released before preparation finishes.
- Queue: `SyncQueuedDevice` row per device, ordered `urgent DESC, lastSyncedTick ASC` among rows seen in the last 5 minutes; `urgent` is sticky. Reason: an errored session leaves the device at the back, but its old `lastSyncedTick` regains priority once the error clears (comment). `activeSync`, `waitingInQueue` and client-synthesised `centralWaking` (503) all mean "no session id" [SES-24].
- Stale sessions: `POST /` closes the device's open sessions as errored; `StaleSyncSessionCleaner` (every minute, `staleSessionSeconds` 3600) closes sessions with no connection for an hour, also errored [SES-23].
