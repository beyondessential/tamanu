# Facility server as a sync client: facts

`F` = `packages/facility-server/app/sync/FacilitySyncManager.js`. Bracketed ids are ledger entries in `ledger/07-facility-client.md` (FAC-nn, or "item n" for its brief-item sections). Already specified: `specs/sync/bootstrap.md`, `specs/sync/run-history.md`, `specs/sync/waking-central.md`.

## 1. Starting a sync

- Schedule: config key `sync.schedule`, default `*/1 * * * *`; `sync.jitterTime` `1s`; `sync.enabled` `true`. A config key, not a setting. `SyncTask` also runs once on start, and calls `triggerSync({ type: 'scheduled', urgent: false })`. `ScheduledTask` skips a tick while the previous run is going, so the schedule alone never queues a follow-up [item 1, FAC-17].
- Disabled: `triggerSync` returns `{ enabled: false }` [item 1].
- User and event triggers, all urgent: web sync-now (`POST /sync/run`, type `userRequested`; the UI gives up waiting after 10 s but the sync continues), marking a patient for sync (type `patientMarkedForSync`; the HTTP response waits for the sync, no race), supervisor `finalSync`, the `sync` subcommand (loops while queued) [FAC-17, FAC-22].
- The sync loop runs in a separate Node process from the API. API callers reach it through `FacilitySyncConnection` (`POST /sync/run`, localhost only, up to 4 attempts, no request timeout). The same `FacilitySyncManager` instance is shared with `SyncTask` so syncs never overlap [item 1, "Not in the transcript"].
- Urgency goes to central only in `startSyncSession({ urgent })`; central queues devices urgent first, then oldest `lastSyncedTick`, and never downgrades a queued urgent request [FAC-20].
- Request while a sync is running (`triggerSync`, instance fields `currentSyncPromise`, `nextSyncPromise`) [FAC-19, item 1]:
  - idle: start `runSync`
  - running, no follow-up queued: create one (`waitForCurrentSyncAndTriggerNextSync`: awaits the current run, then calls `triggerSync()`), and wait for it
  - follow-up already queued: wait for that one; any number of callers share one follow-up and one run row
  - Reason for the follow-up: a sync already in flight was snapshotted before the request (for example before the `patient_facilities` row existed), so it cannot carry it; the code comment says the queued run "will definitely sync any changes made up until the time this sync was requested" [FAC-17]
  - The follow-up is called with no reason: no urgency and no trigger type (`triggerType` null) [FAC-20]
  - If the running sync throws, the queued promise rethrows and no follow-up runs; every waiting caller gets the failure and the next scheduled sync retries [FAC-21]

## 2. `runSync`, step by step

`(shared)` = same code on mobile, per the ledger. Few steps are; most facility code is facility-only [FAC-10, FAC-13, FAC-39].

1. `triggerSync` sets `currentSyncPromise = runSync()` and clears promises in `finally` [item 2].
2. `runSync`: create the `SyncFacilityRun` row first, then record `queued`, `succeeded` or `failed` [item 2].
3. `runSyncSession`: require sync email and password; record start time [item 2].
4. Read `FACT_LAST_SUCCESSFUL_SYNC_PULL`, default -1 [item 2].
5. `bootstrap()` if the cursor is unset and `hasBootstrapped` is false (section 6) [FAC-24].
6. `startSyncSession({ urgent, lastSyncedTick: pullSince })`. Central may answer queued or waking: return `{ queued: true, ran: false }`. Otherwise wait for ready (poll or stream) and receive the new tick [item 2, FAC-33].
7. Record `sessionId` on the run row [item 2].
8. `dropAllSnapshotTables`: drops and recreates schema `sync_snapshots`. Comment: "in case last session errored out or server was restarted" [item 12].
9. `pushChanges` (section 3) [item 2].
10. `pullChanges` (section 4), which calls `saveIncomingChanges` `(shared)` with `withDeferredSyncSafeguards` [FAC-13].
11. `endSyncSession` [item 2].
12. On error: if it is not a `Problem` with a response (a local error), `markSessionErrored` tells central; rethrow. `finally` drops this session's snapshot table only [item 2, FAC-03].
13. Post-sync: `convergeSyncUser`, then `pullSettingsPsk`, each in its own try, failures logged at warn (section 7) [FAC-50].
14. Record duration and `lastCompletedAt`; return `{ queued: false, ran: true }` [item 2].

Order is push then pull. Reason: central alone resolves conflicts; a client takes what it is given, so central must see local changes first. An exception in push skips the pull [FAC-01, FAC-14].

## 3. Push (`pushChanges`)

1. Read the current tick as `currentSyncClockTime` (T, the old tick), then set `FACT_CURRENT_SYNC_TICK` to the tick central issued. From then on the trigger stamps every local write with the new tick [item 3].
2. Wait for pending edits on the old tick T, not the new one: `waitForPendingEditsUsingSyncTick` takes `pg_advisory_xact_lock(T)`. The `set_updated_at_sync_tick` trigger takes a shared lock on the tick it stamps, so this blocks until every transaction that wrote a row with T has committed or rolled back. Reason: otherwise a row stamped T could commit after the snapshot and sit below the cursor forever. New writers use the new tick and are not blocked [item 3, FAC-35].
3. `snapshotOutgoingChanges`: `REPEATABLE_READ` transaction over all push models (`getModelsForPush`: bidirectional, push_to_central, push_to_central_then_delete), rows with `updatedAtSyncTick > FACT_LAST_SUCCESSFUL_SYNC_PUSH` (-1 if unset), `paranoid: false` so soft-deleted rows go. No upper bound, so rows written mid-sync with the new tick may be pushed again next time. No filter by patient or facility. Reason for repeatable read (code comment): otherwise a child could be in the snapshot with its parent missing [FAC-04, FAC-05, item 3].
4. In memory: a plain array, never a snapshot table; the facility inserts no `outgoing` rows. Each model's diff is loaded whole by one `findAll`, mapped to a second array, and the list stays resident until push ends. PR #11763 (Nov 2026) replaced `concat` and spreads with push loops to avoid `RangeError` [FAC-06, FAC-38].
5. Changelogs: `attachChangelogToSnapshotRecords` `(shared)`, in batches of 10,000 records, selecting `logs.changes` with `updated_at_sync_tick >= pushSince` (`>=`, so rows at the cursor resend; central ignores duplicates), no max (central passes one). Runs after, and outside, the repeatable-read snapshot (`inference`: a later changelog row can ride with an older row version) [FAC-39].
6. `pushOutgoingChanges`: pages posted to central, size from `calculatePageLimit`: starts at `initialLimit`, per page `durationPerRecord = lastPageTime / currentLimit`, aims at `optimalTimePerPageMs`, clamped to `[minLimit, maxLimit]` and +/- `maxLimitChangePerPage`; negative duration leaves the limit unchanged. It counts records, not bytes, so assumes equal record size. Mirrored on mobile (file header: change both) [FAC-10, FAC-40].
7. `completePush`: POST `push/complete`, then poll `GET push/complete` until central has persisted; central throws if its persist died [FAC-14].
8. `deleteRedundantLocalCopies`: hard-deletes (`force: true`, by id) the pushed rows of push_to_central_then_delete models: `Attachment`, `CertificateNotification`, `PatientCommunication`, `FacilitySettingMigration`. Reason (code comments): central tasks act on these rows, so a facility copy would be processed twice; the settings migration is a transient carrier. No check that a row is unchanged since the snapshot (`inference`: an edit in between is lost unpushed) [FAC-41, FAC-42].
9. Save `FACT_LAST_SUCCESSFUL_SYNC_PUSH = T` (the old tick, not the new one), after steps 7 and 8, even for an empty push, with no transaction, before the pull starts. If push throws it does not move. So a pull failure leaves the push recorded as successful; push and pull are independently atomic. Intent (stranded local records are worse than a stale facility) is `inference` [FAC-15, FAC-16].
- Directions: `do_not_sync` models (for example `SyncFacilityRun`) are neither pushed nor pulled; push_to_central never pulled; pull_from_central never pushed [item 4].

## 4. Pull (`pullChanges`)

1. Create `sync_snapshots."<sessionId>"` (ordinary table, not `TEMP`; columns `direction`, `record_type`, `record_id`, `is_deleted`, `data`, `changelog_records`). Facility rows are all `incoming` [FAC-07, FAC-08].
2. `initiatePull` (POST `pull/initiate`), wait for central's snapshot to be ready, get `{ totalToPull, pullUntil }` [FAC-43, FAC-45].
3. Polling or streaming: `centralServer.streaming()` reads central setting `sync.streaming.enabled` (default false) from the login response, cached until the next full login (`inference`) [FAC-43].
   - Polling (`pullIncomingChanges`): pages with `fromId` (base64 `{sortOrder, id}`), sized by `calculatePageLimit` timing only the central call; wait for ready is a 1 s poll.
   - Streaming (`streamIncomingChanges`): follows `sync/<session>/pull/stream`, resumes from the last message id, no page limiter, no pause, snapshot writes started in the background with no concurrency cap.
4. Pause: `sync.pauseBetweenCacheBatchInMilliseconds` (50 ms) after each insert chunk of `persistedCacheBatchSize` (10,000), polling mode only. Separately `pauseBetweenPersistedCacheBatchesInMilliseconds` (50 ms) applies during the save and changelog inserts. Reason (PR #4659, stated as likely, not proven): connection pool exhaustion starving foreground web use during big persists; the same PR cut `persistUpdateWorkerPoolSize` to 5 [FAC-44].
5. Each pulled record's `data.updatedAtSyncTick` is set to -1 on the way into the snapshot. Reason for snapshot table (code comment): avoid holding all pulled data in memory (first sync, large imports), and avoid a partially synced local database [FAC-12].
6. "Edited after push snapshot" check, `assertIfPulledRecordsUpdatedAfterPushSnapshot`: after the pull lands in the snapshot, before the save transaction. For each pulled model, throws if any incoming snapshot row (joined on `record_id::text` and `record_type`) matches a local row whose `updated_at_sync_tick` is above the stored `FACT_LAST_SUCCESSFUL_SYNC_PUSH`; one `EXISTS` query per model, serial; pulled deletes covered (PR #11269). Config `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot`, default `true`, read live. When it fires: a plain `Error`, nothing pulled saved, pull cursor unmoved, central told the session errored, run `failed`; the push cursor stays advanced so the next sync pushes the edit, central resolves, and the facility pulls the result. Reason (code comment, PR #4599): the pulled record would overwrite the local edit, which would never reach central. It compares ticks only, not field values; any local writer counts, not just people. Compares against the pre-session tick, so a write stamped with the new tick that was pushed this session can still trip it (`inference`). Off by default in releases in Mar 2024 (PRs #5519, #5520; reason `unverifiable`), on again by PR #8326 [FAC-02, FAC-03, FAC-46, FAC-47, item 6].
7. `recordSyncRunProgress` `persistStartedAt`, outside the save transaction so it is visible while the save runs. Reason: tell a hang while saving from a hang exchanging with central [FAC-48].
8. One `sequelize.transaction` for all pulled models: if `totalPulled > 0`, `pauseAudit` (sets `audit.pause` so triggers write no `logs.changes`); `withDeferredSyncSafeguards` (deferrable FK and unique constraints deferred to commit, then immediate); `saveIncomingChanges` `(shared)` in dependency order; then save `FACT_LAST_SUCCESSFUL_SYNC_PULL = pullUntil` inside the same transaction, even when nothing was pulled. Reason (code comment): if setting the cursor fails the saves roll back, so they are not later mistaken for local edits needing a push [item 5, FAC-13].
9. Not marked as local edits: tick -1 is turned into -999 (`LAST_UPDATED_ELSEWHERE`, "do not push") by the `set_updated_at_sync_tick` trigger. Deletes and restores ride the same INSERT or UPDATE, never `destroy()` or `restore()`, which would stamp the current tick and echo the delete back. No field merge on the facility, the pulled version is final; restore versus delete follows `isDeleted` only. Central's changelog rows are inserted from `changelog_records` with `ignoreDuplicates` [item 7, FAC-01, FAC-49].
10. `recordSyncRunProgress` `persistCompletedAt` [FAC-48].

## 5. Cursors and facts

| Name | Meaning | Written |
| --- | --- | --- |
| `FACT_CURRENT_SYNC_TICK` | tick the trigger stamps on local writes | in `pushChanges`, set to the session's new tick before the pending-edit wait [item 3] |
| `FACT_LAST_SUCCESSFUL_SYNC_PUSH` | lower bound of the next push snapshot; the assert's comparison value | end of `pushChanges`: the old tick, no transaction [FAC-15] |
| `FACT_LAST_SUCCESSFUL_SYNC_PULL` | `lastSyncedTick` sent to central; unset (-1) means first sync and triggers bootstrap | inside the pull save transaction: `pullUntil`. Bootstrap does not write it [FAC-31] |
| sync email (fact) and password (secret) | the credentials used to log in to central | `convergeSyncUser` after the swap; the setup wizard [FAC-51] |
| settings PSK (fact) | deployment-wide key decrypting integration secrets in synced settings | `pullSettingsPsk`, only if absent [FAC-52] |

- The web "patient synced" check compares both cursors (`lastPush > patientFacility tick && lastPull > lastPush`), so changing what either stores is UI-visible [FAC-15].
- Sync host and credentials come from local facts (env `SYNC_URL` or setup wizard); config `host`, `email`, `password` are a deprecated fallback [config comment].

## 6. Bootstrap

- Runs when the pull cursor is unset and `hasBootstrapped` is false, before `startSyncSession` (so even if central will queue the sync). Also run by the setup wizard in the same transaction as configuration. Not feature flagged. Failure is logged at warn, never blocks sync, retried next attempt; `hasBootstrapped` is set only on success [FAC-24, FAC-30, FAC-31].
- Why (PR #11305): a new facility cannot be logged into until its first sync pulled its whole share, which can take hours. The PR also added a "Setting up this facility" screen (no progress shown) [FAC-24, FAC-32].
- Models (nine): `ReferenceData`, `SensitiveNetwork`, `Facility`, `User`, `UserFacility`, `Role`, `Permission`, `Setting`, `TranslatedString`. Reference data, translated strings narrowed further than sync narrows them [FAC-28, FAC-26].
- Reading (central, `buildFacilityBootstrap`): one `REPEATABLE_READ` transaction, one table at a time, no snapshot table, the model's own `buildSyncFilter()` (not the lookup table) from `since: -1`. Reason (code comment): separate reads could ship a record referencing one the bundle lacks, so the facility could not save at all. One JSON body in memory on both ends [FAC-25 to FAC-29].
- Applying (`applyBootstrap`): same wrapper as a pull save (tick -1, audit paused, constraints deferred, dependency order), batched by `persistedCacheBatchSize`, one transaction; re-applying replaces rows [FAC-31].
- Leaves unset: `FACT_LAST_SUCCESSFUL_SYNC_PULL`. The first real sync therefore pulls from -1 and overwrites every bootstrapped row, so bootstrap ticks never matter [FAC-31].
- Gap: no test found that runs bootstrap into a full first sync (`inference`, only named files searched) [FAC-31].

## 7. After the session

- Both run only after `endSyncSession` succeeded, each in its own try, failure at warn, retried on the next sync, cheap no-ops once done [FAC-50].
- `convergeSyncUser`: swaps a human admin's config credentials for a dedicated per-device sync user. Returns early if the account kind is unknown or already `sync`, the recorded email differs from the account in use, or device id or facility ids are missing. Otherwise POST `admin/syncCredentials` (`deviceId`, `facilityIds`), store new email (fact) and password (secret) in one transaction, re-read config, clear the token [FAC-51].
- `pullSettingsPsk`: if no key stored, GET `admin/settingsPsk`; refuse an empty value; store it and clear the cached key so no restart is needed [FAC-52]. PSK = pre-shared key, one per deployment (`facts.ts`, secret-encryption spec) [FAC-53].
- Why on sync, not upgrade (PR #10586): needs central, and a facility offline during upgrade must still converge. Order matters: central serves the PSK to `kind: sync` users only, so the swap lands first. Affects facilities configured before the setup wizard; wizard installs already have a sync user [FAC-50, FAC-51].

## 8. The connection to central (`CentralServerConnection`, a `TamanuApi` subclass)

- Defaults: `timeout` 10,000 ms (`sync.timeout`), `waitForAuth`, `backoff` [item 10].
- Retries (`fetchWithRetryBackoff`): 15 attempts, Fibonacci delay x 300 ms, capped at 10 s (about 76 s total). Only thrown transport errors retry; any HTTP response is returned. 4xx, `CLIENT_INCOMPATIBLE`, invalid credentials and "Sync session" errors never retry. Login uses `sync.backoff` (same values) [item 10].
- Poll-until-ready: `pollUntilTrue` / `pollUntilOk`, one request per second, up to 12 hours. Used for session ready, pull ready and push complete (always, even when streaming). Each poll is itself a request with the 10 s timeout and retry [FAC-34].
- Auth: try token refresh, else log in with sync email and password, scope `DEVICE_SCOPES.SYNC_CLIENT`; on an auth error reconnect once and repeat [item 10].
- Waking central: only at session start (and the login it triggers). HTTP 503 with a non-empty `Retry-After` gives `{ status: 'centralWaking' }`, no session, run recorded `queued`, nothing waits, the next scheduled sync tries again. A bare 503 is an ordinary failure. Push and pull calls have no waking handling. Reason (spec note): a 503 without `Retry-After` says nothing about when to retry [FAC-33].
- Every request sends `x-version` and `x-tamanu-client`; login rejects a token for a different device id; central answers a too-old or too-new client with `CLIENT_INCOMPATIBLE` (no handler on the facility, the run just fails). Device id is also in the session start, pull-initiate and push-complete bodies [item 10].
- HTTP client: `faithFetch` replaces node `fetch` (`@passcod/faith`, Rust, DNS cache, HTTP/2, lazy load). Reason (PR #10656): thousands of small requests over slow links. Maps network errors to `Error('faith: <code>')` to keep logs short. Disabled with env `TAMANU_DISABLE_FAITH_FETCH=true` (env, not a setting, because facility settings arrive only by sync) [item 10].
- The facility never sends `tablesToInclude` or `tablesForFullResync` [FAC-09].

## 9. Run history (`sync_facility_runs`)

- One row per run (callers sharing a follow-up share a row); created before anything else; columns include `triggerType` (the reason's `type`), `urgent`, `sessionId` (once issued), `persistStartedAt`, `persistCompletedAt`, status `running`, `queued` (no session), `succeeded`, `failed` plus `error` message [item 11].
- `do_not_sync`, no `updatedAtSyncTick`, indexed on `start_time` and `(status, start_time)`, kept forever. Failure to record never fails the sync [item 11].
- Reason (PR #11366): alerting only fired on repeated failures, so a hung or slow sync never flagged; follow-up is a Canopy healthcheck. A run whose process died stays `running` with no completion time, the intended alert signal [FAC-23, item 11].
- `GET /sync/status` is separate: instance fields `lastDurationMs`, `lastCompletedAt`, `currentStartTime`, polled by the web app every 2 s while patients are marking [FAC-22].

## 10. Restarts and leftovers

- Snapshot tables are real tables, so a crash leaves them behind until the next session start: step 8 of section 2 drops the schema, but only after central issued a session id (a queued or waking attempt returns first). It removes everything in the schema [FAC-07, item 12].
- Crash during push, or after central persisted but before the push cursor save: cursor unmoved, same rows pushed again (central writes idempotently). Crash mid-pull: orphaned snapshot rows, cursor unmoved, pull again. Crash mid-persist: the single transaction rolls back [item 12].
- Central session: closed when the same device reconnects. Run row stays `running`. Promise state and `hasBootstrapped` reset with the process [item 12].

## 11. Config keys (`packages/facility-server/config/default.json5`, all config not settings)

| Key under `sync` | Default | Controls |
| --- | --- | --- |
| `schedule` | `*/1 * * * *` | cron for scheduled syncs |
| `jitterTime` | `1s` | random delay on the schedule |
| `enabled` | `true` | master switch; off returns `{ enabled: false }` |
| `timeout` | 10000 | per-request timeout to central (ms) |
| `backoff` | `multiplierMs` 300, `maxAttempts` 15, `maxWaitMs` 10000 | login retries; the same values drive request retries |
| `syncApiConnection` | `http://localhost`, port 4100 | API process to sync process link |
| `persistedCacheBatchSize` | 10000 | insert chunk when writing the snapshot, and save batch size |
| `pauseBetweenCacheBatchInMilliseconds` | 50 | pause per snapshot insert chunk (polling pull) |
| `pauseBetweenPersistedCacheBatchesInMilliseconds` | 50 | pause between save and changelog batches |
| `persistUpdateWorkerPoolSize` | 5 | concurrent updates when saving |
| `assertIfPulledRecordsUpdatedAfterPushSnapshot` | `true` | the section 4 check |
| `dynamicLimiter` | `initialLimit` 10, `minLimit` 1, `maxLimit` 10000, `optimalTimePerPageMs` 2000, `maxLimitChangePerPage` 0.2 | page size for push and polling pull |
| `host`, `email`, `password` | empty | deprecated fallback to local facts |

- Streaming is a central setting, `sync.streaming.enabled` (default false) [FAC-43].
