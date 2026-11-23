# Facility server as a sync client

Area prefix `FAC`. Code read at worktree HEAD `61e7060846`; `22d3edaa36` named in the brief is an ancestor and nothing under `packages/facility-server/app/sync`, `packages/database/src/sync` or `packages/api-client` differs between them. Transcript ranges: Part 1 00:26:03-00:27:10, 00:30:57-00:33:17, 00:40:30-00:45:36; Part 3 00:49:30-01:18:30 (the Part 3 timestamps are the second set of `###` headings, after "## Part 3").

All paths are relative to the repository root. `F` below abbreviates `packages/facility-server/app/sync/FacilitySyncManager.js`.

## Drift

- FAC-07 partly: snapshot tables are ordinary tables (not `TEMP`) in schema `sync_snapshots`, dropped explicitly; on a facility only incoming rows ever go in them.
- FAC-10 partly: the page limiter adjusts on how long the last page took, but assumes every record is the same size (it counts records, not bytes). The speaker later notices this himself (FAC-37).
- FAC-18 partly: "everything in the UI" goes through `triggerSync`, not through a function called "wait for current and trigger next"; that method is private to `triggerSync` and has one call site.
- FAC-20 wrong (on urgency): the follow-up sync that is queued behind a running one runs with no reason at all, so it is never urgent and has no trigger type. Urgency is honoured only for the call that starts a sync from idle.
- FAC-22 partly: the facility has no progress reporting, but it does expose `/sync/status` and records run progress timestamps in `sync_facility_runs`.
- FAC-23 partly: `sync_facility_runs` was added for alerting on hung or slow syncs (PR #11366), not primarily to carry the error.
- FAC-24 partly: bootstrap also runs in the setup wizard, and "once per process" is "once per process after it succeeds, and only while the pull cursor is unset".
- FAC-32 partly: the bootstrap PR (#11305) did add a "Setting up this facility" screen, but it shows no progress; progress was split into a separate card.
- FAC-33 partly: central waking is handled only at session start (and its login), is applied unconditionally rather than "staging only", and does not wait: it ends the attempt as queued.
- FAC-38 outdated: both array-building concerns were fixed by PR #11763 on 20 Nov 2026 (after the sessions).
- FAC-39 partly: changelog attach uses `>=` on the source tick, not `>`; central does pass a max, facility does not (confirmed).
- FAC-44 partly: the pull-time pause is `sync.pauseBetweenCacheBatchInMilliseconds`, a different key from the persist-time `pauseBetweenPersistedCacheBatchesInMilliseconds`, and it only applies in polling mode. PR #4659's stated reason is a guess at connection-pool exhaustion, not "resource hogging" as such.
- FAC-46 partly: on/off history confirmed from the repository; the reason it was switched off is not recorded anywhere I found.
- FAC-53 wrong: PSK is defined in code and in a spec (see below).

## Claims

### FAC-01 Push first because central alone resolves conflicts; clients accept what they are given
Source: Part 1 00:26:03
Verdict: confirmed
Evidence: `F:225-227` runs `pushChanges` before `pullChanges`. On the facility, `saveUpdates` takes the pulled record as final: `packages/database/src/sync/saveChanges.ts:48-61` merges (`mergeRecord`) only when `isCentralServer`, and "on the facility server, trust the resolved central server version". `saveChangesForModel` is called with `isCentralServer = false` by default (`packages/database/src/sync/saveIncomingChanges.ts:183-188`).
Why: comment at `saveChanges.ts:60` ("trust the resolved central server version"); ordering is the mechanism for conflicts (see FAC-02).
Notes: "never compares to its local version" has two small exceptions that are not conflict resolution: the facility decides restore versus delete from its own `deletedAt` (`saveIncomingChanges.ts:64-80`; "Restores only originate from central server"), and the abort in FAC-02, which compares only sync ticks, not field values.

### FAC-02 Local edit after the push snapshot plus a pulled change to the same record aborts the whole sync
Source: Part 1 00:26:03 (restated Part 3 01:12:34)
Verdict: confirmed
Evidence: `F:349-354` calls `assertIfPulledRecordsUpdatedAfterPushSnapshot` after the pull has landed in the snapshot table and before the save transaction (`F:358`). `packages/facility-server/app/sync/assertIfPulledRecordsUpdatedAfterPushSnapshot.js:12-41` throws if any incoming snapshot row joins to a live row whose `updated_at_sync_tick` is greater than the stored last-successful-push cursor.
Why: header comment `assertIf...js:5-10`: such a record "would get overwritten by pullings if we proceed. Throw an error so that the sync restarts and the updated record is not forgotten and pushed to central in the next sync". Added by PR #4599 (SAV-286).
Notes: full detail in FAC-47 and the answers section.

### FAC-03 The local change is not lost: next sync pushes it, central decides, facility pulls the result
Source: Part 1 00:27:10
Verdict: confirmed
Evidence: the throw happens before the save transaction, so nothing pulled is persisted and the pull cursor is not moved (`F:358-372` is never reached). The push cursor was already advanced to the pre-session tick (`F:326`), and the edited row carries a tick above it, so it is picked up by the next `snapshotOutgoingChanges(..., pushSince)` (`F:301-304`). Pinned by `packages/facility-server/__tests__/sync/FacilitySyncManager-edgecases.test.js:229` ("throws an error if a pulled record was updated between push and pull").
Why: see FAC-01.
Notes: the error is a plain `Error`, not a `Problem` with a response, so `runSyncSession` also tells central the session errored (`F:229-234`, `markSessionErrored`), and the run is recorded as failed (`F:150-155`).

### FAC-04 Push starts with a point-in-time snapshot of the facility database, repeatable read
Source: Part 1 00:30:57, again Part 3 01:03:52
Verdict: confirmed
Evidence: `packages/facility-server/app/sync/snapshotOutgoingChanges.js:51-61` wraps all per-model reads in `sequelize.transaction({ isolationLevel: REPEATABLE_READ })`.
Why: comment at `snapshotOutgoingChanges.js:47-50`: without it a child could be in the snapshot with its parent missing; "as the snapshot only contains read queries, there will be no concurrent update issues". Also `F:297-300`: avoids "data that isn't internally coherent" arriving at central.
Notes: the transaction is not a CLS-less manual one: it passes `transaction` explicitly to `findAll` (`snapshotOutgoingChanges.js:13`), unlike the codebase convention in `llm/project-rules/sequelize-transactions.md`; harmless here.

### FAC-05 The facility pushes everything that changed since its last successful push
Source: Part 1 00:30:57
Verdict: confirmed
Evidence: `snapshotChangesForModel` selects `updatedAtSyncTick > since`, `paranoid: false` (so soft-deleted rows are included), for every model in `getModelsForPush` (bidirectional, push-to-central, push-then-delete: `packages/database/src/sync/getModelsForDirection.ts:20-25`). `since` is `FACT_LAST_SUCCESSFUL_SYNC_PUSH`, or -1 if unset (`F:301`). There is no filter by patient or facility (see FAC-37).
Why: facility to central needs no sync filter; the facility holds only what it should.
Notes: `snapshotOutgoingChanges.js:29-45` throws if any model passed is not a push-capable direction.

### FAC-06 Facility push snapshot is held in memory, not a table (the speaker's correction at 00:42:30)
Source: Part 1 00:32:11, corrected 00:42:30; Part 3 01:03:52, 01:08:27
Verdict: confirmed (the correction)
Evidence: `snapshotOutgoingChanges.js:54-59` accumulates into a plain array, returned to `F:304`. `F:312-322` attaches changelogs to those same objects and `pushOutgoingChanges` slices that array into pages (`packages/facility-server/app/sync/pushOutgoingChanges.js:6-9`). `insertSnapshotRecords` is called only from the pull code (`pullIncomingChanges.js:67, 90`); the facility never inserts `outgoing` rows.
Why: the only stated reason is the speaker's: a facility normally pushes only a diff. No code comment states it, and no comment on the facility side warns about memory for push (the only memory comment is for pull, `pullIncomingChanges.js:61-65`).
Notes: see "Open questions answered" for the size risk.

### FAC-07 Snapshot tables are temporary tables named by session ID in schema `sync_snapshots`
Source: Part 1 00:32:11, 00:33:17
Verdict: partly
Evidence: `packages/database/src/sync/manageSnapshotTable.ts:6,18-22,32-57`: `CREATE TABLE "sync_snapshots"."<sessionId>"` (not `CREATE TEMP TABLE`), columns include `direction`, `record_type`, `record_id`, `is_deleted`, `data json`, `changelog_records json`, with autovacuum off. Cleanup is explicit: `dropSnapshotTable` (`:59-64`) and `dropAllSnapshotTables` (`:78-82`, which drops and recreates the whole schema).
Why: n/a.
Notes: a crash therefore leaves real tables behind until the next session start (brief item 12). On central there are extra `<sessionId>_{full,regular}_sync_marked_for_sync_patients` tables (`manageSnapshotTable.ts:24-30`).

### FAC-08 Incoming versus outgoing in the snapshot is distinguished by a `direction` column
Source: Part 1 00:33:17 (answered 00:43:28)
Verdict: confirmed
Evidence: `manageSnapshotTable.ts:41` (`direction text NOT NULL`), values from `packages/database/src/sync/constants.ts:1-4` (`incoming`/`outgoing`); one table per session for both directions; indexes on `(direction, id)` and `(direction, record_type, id)` (`:54-55`).
Why: n/a.
Notes: on the facility only `incoming` rows exist, so the assert in FAC-47 filters `direction = incoming` mostly as a safeguard.

### FAC-09 Central runs two snapshot passes into one table for the pull (newly marked patients from zero, then everything since the last sync)
Source: Part 1 00:39:21, 00:40:30
Verdict: confirmed (shallow; central side, covered by the central ledger)
Evidence: `packages/central-server/app/sync/CentralSyncManager.js:487-512` counts `patient_facilities` rows with tick above `since` and builds a full-sync and an incremental marked-for-sync patients table; `:568-600` runs `snapshotOutgoingChanges` first with `-1` for the full table and then for regular changes.
Why: facility need not redeclare a long patient list (speaker's reasoning, `inference` from the code shape).
Notes: the facility's only input is `since` (`packages/facility-server/app/sync/CentralServerConnection.js:194-199`); it does not send `tablesToInclude` or `tablesForFullResync` (also absent from `completePush`, `:240-245`), though central reads them (`buildSyncRoutes.js:363`).

### FAC-10 Dynamic page size for push and pull, adjusted by how long the last page took, measuring data size
Source: Part 1 00:40:30, 00:41:35
Verdict: partly
Evidence: `packages/facility-server/app/sync/calculatePageLimit.js:5-40`. The limit starts at `initialLimit`, then each page computes `durationPerRecord = lastPageTime / currentLimit` (`:28`) and aims at `optimalTimePerPageMs`, clamped to `[minLimit, maxLimit]` and to +/- `maxLimitChangePerPage` of the current limit (`:31-39`). A negative duration (clock went backwards) leaves the limit alone (`:24-26`). Used by push (`pushOutgoingChanges.js:5,15`, timing the `centralServer.push` round trip) and polling pull (`pullIncomingChanges.js:26,35-48,72`, timing only the `centralServer.pull` call, not the local insert).
Why: aim for a roughly constant page duration over slow links. The file is "mirrored on mobile" (`calculatePageLimit.js:1`).
Notes: it counts records, not bytes: see FAC-37. Streaming pull does not use it. The comment at line 1 means a change here must also be made in the mobile copy.

### FAC-11 The target duration is configurable
Source: Part 1 00:41:35 (second speaker)
Verdict: confirmed
Evidence: `packages/facility-server/config/default.json5:35-41`: `sync.dynamicLimiter` = `initialLimit` 10, `minLimit` 1, `maxLimit` 10000, `optimalTimePerPageMs` 2000, `maxLimitChangePerPage` 0.2. These are config-file keys, not settings.
Why: n/a.
Notes: see "Not in the transcript" on config versus settings.

### FAC-12 Pulled records are not written straight to the database; they go to a snapshot table first
Source: Part 1 00:41:35
Verdict: confirmed
Evidence: `pullIncomingChanges.js:61-70` (polling) and `:88-100, 136-140` (streaming) call `insertSnapshotRecords`; the real tables are written later in `F:358-372`.
Why: comment `pullIncomingChanges.js:61-65`: avoid holding all pulled data in memory, because of the first sync and of big imports that a facility then syncs down; and (`F:331-333`) avoid "a period of time where the local database may be partially synced".
Notes: each pulled record's `data.updatedAtSyncTick` is overwritten with `-1` on the way in (`pullIncomingChanges.js:56`, `:96`); see brief item 7.

### FAC-13 After pulling into the snapshot, the facility persists with the same sort of process, constraints checked, then the sync is successful
Source: Part 1 00:43:28
Verdict: confirmed
Evidence: `F:358-372` runs `saveIncomingChanges` (shared with central, `saveIncomingChanges.ts:183-205`) inside one `sequelize.transaction`, under `withDeferredSyncSafeguards` (`packages/database/src/sync/withDeferredSyncSafeguards.ts:28-81`), which defers deferrable FK and unique constraints to commit and then sets them back to immediate so a violation throws at the end of the operation. Models are saved in dependency order (`sortInDependencyOrder`, `saveIncomingChanges.ts:189`).
Why: comment `withDeferredSyncSafeguards.ts:43-54`: self-referencing foreign keys and unique constraints would otherwise fail on a batch's intermediate state.
Notes: the whole pull for every model is a single transaction, so the persist pauses (FAC-44) happen inside a long-running transaction.

### FAC-14 Pull depends on push having succeeded; push can succeed without a pull
Source: Part 1 00:43:28
Verdict: confirmed
Evidence: `F:225-227`: `pushChanges` then `pullChanges` in one `try`; an exception in push skips the pull. Push success includes central having finished persisting: `pushOutgoingChanges.js:17` awaits `centralServer.completePush`, which POSTs `push/complete` and then polls `GET push/complete` until true (`CentralServerConnection.js:240-250`); central's `checkPushComplete` throws if persistence died (`CentralSyncManager.js:896-912`).
Why: "we want anything changed locally to be received and conflict-resolved by central before we pull" (speaker); consistent with FAC-01.
Notes: none.

### FAC-15 Push is recorded successful on the client even when the pull then fails (push and pull are independently atomic)
Source: Part 1 00:43:28, 00:44:31
Verdict: confirmed
Evidence: the push cursor is written at `F:326` (`LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, currentSyncClockTime)`), at the end of `pushChanges`, as its own statement with no transaction, before `pullChanges` starts at `F:227`. The pull cursor is written separately inside the persist transaction (`F:371`). A pull failure therefore leaves the push cursor advanced and the pull cursor where it was.
Why: speaker's stated reason (records stranded on a facility are worse than a stale facility); consistent with the code. `inference` for the intent, since no comment states it.
Notes: the value stored is `currentSyncClockTime`, the facility's tick as it was before this session (read at `F:287`), not the new tick central issued. It is stored even when `outgoingChanges` is empty (the `if` at `F:305` closes before `F:326`). The web app relies on these two cursors to decide a patient marked for sync is fully synced: `packages/web/app/contexts/SyncState.jsx:44-54` (`lastPush > patientFacility tick && lastPull > lastPush`).

### FAC-16 Facility's bigger risk is stranded records, so it lets push succeed even if it cannot pull
Source: Part 1 00:44:31
Verdict: unverifiable (as a reason); consistent with the code
Evidence: see FAC-15. No comment or PR states it.
Why: `inference`.
Notes: none.

### FAC-17 `FacilitySyncManager` manages concurrency itself: scheduled syncs and user-triggered syncs; a newly marked patient must not wait a whole interval
Source: Part 3 00:49:30
Verdict: confirmed
Evidence: `F:88-126` `triggerSync`; schedule in `packages/facility-server/app/tasks/SyncTask.js:14,26-35` (config `sync.schedule`, default `*/1 * * * *`, `sync.jitterTime` `1s`, `sync.enabled` true; `packages/facility-server/config/default.json5:11,30,29`). User and patient-marking paths: `packages/facility-server/app/routes/apiv1/sync.js:14-39` (`POST /sync/run`, urgent, type `userRequested`) and `packages/facility-server/app/routes/apiv1/patientFacility.js:7-33` (type `patientMarkedForSync`, urgent, awaited before the response); plus `supervisor.js:25` (`finalSync`) and the `sync` subcommand (`subCommands/sync.js:26`, urgent, loops while queued). All of the API callers go API process -> `FacilitySyncConnection.runSync` -> `POST /sync/run` on the sync process (`routes/sync/sync.js:26-36`) -> `triggerSync`.
Why: comment `F:94-96`: the queued next run "will definitely sync any changes made up until the time this sync was requested". A sync already in flight started before the `patient_facilities` row existed, so it cannot carry it; hence a follow-up must start straight after, not at the next cron tick (`inference`, consistent with the speaker).
Notes: details in "Open questions answered" 1.

### FAC-18 "Wait for current sync and trigger next sync" is what everything in the UI goes through
Source: Part 3 00:49:30
Verdict: partly
Evidence: `F:83-86` defines `waitForCurrentSyncAndTriggerNextSync`; its only caller is `F:104`. External callers all call `triggerSync` (FAC-17).
Why: n/a.
Notes: the speaker later says it is "not externally called"; that is the accurate version.

### FAC-19 `triggerSync` checks for a running sync and an already queued next one; if there is one it just waits for that
Source: Part 3 00:50:43
Verdict: confirmed
Evidence: `F:97-100` (`nextSyncPromise` set: await it and return its result), `F:103-107` (a current run only: create the next promise by chaining), `F:109-125` (idle: start `runSync`). `currentSyncPromise` and `nextSyncPromise` are instance fields (`F:56-60`), cleared in `finally` (`F:120-125`).
Why: so any number of callers during one run share exactly one follow-up run (test `FacilitySyncManager.test.js:46-80`, and `:364-383` which shows two callers share one follow-up and two run rows result).
Notes: the speaker's claim that `triggerSync` "doesn't wait for the sync" is wrong: it awaits and returns the result (`F:118-119`); the only difference is the chaining.

### FAC-20 Urgency is passed and always honoured
Source: Part 3 00:50:43 (marked unclear in the transcript)
Verdict: wrong, as far as the queued follow-up is concerned
Evidence: `F:113` stores the reason of the call that starts a run. The follow-up goes through `waitForCurrentSyncAndTriggerNextSync`, which calls `this.triggerSync()` with no argument (`F:85`), so its `reason` is `undefined`, its `urgent` is `undefined` (`F:203`) and `triggerType` is null (`F:139`). Urgency reaches central via `startSyncSession({ urgent })` (`F:202-205`), where central queues devices urgent-first, then oldest `lastSyncedTick` first, and never lets a later non-urgent request downgrade a queued urgent one (`packages/database/src/models/SyncQueuedDevice.ts:54-55, 86-91`).
Why: not documented; looks like an oversight (`inference`).
Notes: so a patient marked for sync while another sync is running gets an urgent flag only on the first, already-running sync's behalf, not on its own follow-up. Order of continuations (`inference` from reading the code, not run): the outer `finally` (`F:120-125`) runs before the chained call at `F:85`, so by then both promises are cleared and the chained `triggerSync()` starts a fresh run.

### FAC-21 The manager holds the current sync promise and next sync promise at instance level
Source: Part 3 00:50:43
Verdict: confirmed
Evidence: `F:56-60`. Also `isSyncRunning()` (`F:79-81`) is `Boolean(currentSyncPromise)` and feeds `/sync/status` (`routes/sync/sync.js:54`).
Why: n/a.
Notes: if the running sync throws, `await this.currentSyncPromise` at `F:84` rethrows into the queued promise, so `triggerSync()` is never called and the follow-up does not run; every caller waiting on the next promise gets the failure. The scheduled run on the next minute is what retries.

### FAC-22 Outcome and progress reach the UI through instance properties or pub-sub; facility just shows a timer toast
Source: Part 3 00:52:31
Verdict: partly
Evidence: no event emitter in the facility sync code. The instance fields `lastDurationMs`, `lastCompletedAt`, `currentStartTime` (`F:65-69`, set at `F:183-184, 263-264`) are returned by `GET /sync/status` (`routes/sync/sync.js:38-66`), which the web app polls every 2 seconds only while patients are marked and syncing (`packages/web/app/contexts/SyncState.jsx:73-83`). The user-triggered route returns a message after a 10 second race, "Sync is taking a while, continuing in the background..." (`routes/apiv1/sync.js:6-12, 29-35`).
Why: n/a.
Notes: `recordSyncRunProgress` (`F:166-175`) writes `sessionId`, `persistStartedAt`, `persistCompletedAt` to the run row, for monitoring not for the UI.

### FAC-23 `SyncFacilityRun` carries the error so it is stored on the facility
Source: Part 3 00:54:07
Verdict: partly
Evidence: `F:138-156`: a row is created before anything else, completed as `queued`, `succeeded` or `failed` (with `error` message). Model `packages/database/src/models/SyncFacilityRun.ts:15-67`; statuses `packages/constants/src/sync.ts:35-40`.
Why: PR #11366: "Our sync alerting only fires on repeated failures, so a facility sync that hangs or takes too long never flags"; it ends with "Follow-up: a Canopy healthcheck reading this table". So alerting on hung syncs (and Canopy) is the stated reason; the error column is incidental.
Notes: see brief item 11.

### FAC-24 Bootstrap runs once per process; fetches the minimal data needed to log in while the rest syncs
Source: Part 3 00:54:07
Verdict: partly
Evidence: `F:191-195`: runs when the pull cursor is unset (`|| -1`) and `!this.hasBootstrapped`; `F:273-283` `bootstrap()` fetches (`CentralServerConnection.js:130-136`, `POST sync/bootstrap` with the server's facility ids), applies in one transaction, sets `hasBootstrapped = true` only on success, and swallows failure with a warning, so it is retried on the next attempt. It is called before `startSyncSession` (`F:198`), so it runs even if central will queue the sync. The setup wizard also fetches and applies it in the same transaction as configuration (`packages/facility-server/app/routes/apiv1/setup.js:176-197, 222-225`).
Why: `specs/sync/bootstrap.md` ("When a facility bootstraps") and PR #11305: "A new facility server can't be logged into until its first sync has pulled its whole share of central, which can take hours".
Notes: pinned by `packages/facility-server/__tests__/sync/FacilitySyncManager-bootstrap.test.js:66-110`.

### FAC-25 Central reads every bootstrap table inside one repeatable read transaction
Source: Part 3 00:54:07
Verdict: confirmed
Evidence: `packages/central-server/app/sync/buildFacilityBootstrap.js:76-90` (`repeatableReadTransaction`). Test: `packages/central-server/__tests__/sync/facilityBootstrap.test.js:217` ("reads every table from one snapshot, so a mid-build write cannot break its references").
Why: comment `buildFacilityBootstrap.js:76-79`: read separately, a record committed mid-build could arrive referencing a record the bundle lacks, and "the facility could not save the bootstrap at all".
Notes: none.

### FAC-26 Bootstrap reads each source table with the model's own sync filter, in the same shape as the outgoing snapshot
Source: Part 3 00:55:45
Verdict: confirmed
Evidence: `buildFacilityBootstrap.js:41-74`: `model.buildSyncFilter() ?? 'WHERE TRUE'`, `since: -1`, `facilityIds`, attributes minus `COLUMNS_EXCLUDED_FROM_SYNC`, emitting `recordType`, `recordId`, `isDeleted`, `data`. Two tables are narrowed further than sync narrows them (`extraWhereFor`, `:27-36`): reference data to facility catchments, translated strings to a fixed id list and prefixes.
Why: "so each record is the one the facility's own pull would carry" (`:39-40`).
Notes: `specs/sync/bootstrap.md` "Serving the bootstrap".

### FAC-27 It goes one table at a time, with no snapshot table; fastest route to what the facility needs
Source: Part 3 00:55:45
Verdict: confirmed
Evidence: `buildFacilityBootstrap.js:83-88` ("a bootstrap is small, and there's no call to contend for connections"); the facility applies it with `applyBootstrap` (`packages/facility-server/app/sync/facilityBootstrap.js:17-38`), which batches each model by `persistedCacheBatchSize` and never uses `sync_snapshots`.
Why: comments as quoted.
Notes: the whole response is one JSON body held in memory on both ends (`buildSyncRoutes.js:165-168`). The earlier `records.push(...spread)` here, flagged as an OOM or `RangeError` risk, was replaced by a loop in PR #11763.

### FAC-28 Bootstrap models: reference data, sensitive network, facility, user, user facility, role, permission, setting, translated string
Source: Part 3 00:55:45, 00:57:04
Verdict: confirmed
Evidence: `buildFacilityBootstrap.js:15-25` lists exactly those nine (`ReferenceData`, `SensitiveNetwork`, `Facility`, `User`, `UserFacility`, `Role`, `Permission`, `Setting`, `TranslatedString`).
Why: `specs/sync/bootstrap.md` "Contents".
Notes: not every setting or reference data row is sent (FAC-26); the facility applies only models for which central returned rows (`facilityBootstrap.js:19-21`).

### FAC-29 Bootstrap does not use the lookup table; it relies on the old pre-lookup sync filters, which therefore must stay
Source: Part 3 00:57:04
Verdict: confirmed
Evidence: `buildFacilityBootstrap.js:46` calls `buildSyncFilter()`; central's ordinary snapshot still uses the same method when the lookup table is not used (`packages/central-server/app/sync/snapshotOutgoingChanges.js:40`, lookup branch at `:355`). `packages/database/src/models/ReferenceData.ts:214`, `Setting.ts:245`, `User.ts:248` define filters the bootstrap depends on.
Why: speaker's inference that these filters cannot be deleted; true for this code.
Notes: removing `buildSyncFilter` from a bootstrapped model would silently change the bootstrap.

### FAC-30 Bootstrap is not feature flagged and runs for any new sync from scratch in production
Source: Part 3 00:57:04, 00:59:40 ("landed last month")
Verdict: confirmed
Evidence: no config or setting guards `F:193`; condition is only `pullSince === -1 && !hasBootstrapped`. Merged by PR #11305 on 2026-10-14.
Why: n/a.
Notes: also reached by the wizard (FAC-24).

### FAC-31 Bootstrap adds surface area: repeated query logic, different ticks from what the cursor becomes, no snapshot table
Source: Part 3 00:58:28
Verdict: confirmed (facts bearing on it listed)
Evidence:
- Duplicated logic: `queryModelRecords` re-implements the snapshot row shape (`buildFacilityBootstrap.js:41-74`) and `applyBootstrap` re-implements the pull-save wrapper (`facilityBootstrap.js:17-38`: `pauseAudit`, `withDeferredSyncSafeguards`, dependency order, `saveChangesForModel` with `isCentralServer = false`).
- Ticks: bootstrap rows carry no source tick; the facility stamps them `-1` (`facilityBootstrap.js:28-30`), stored as `-999`.
- Cursor: bootstrap deliberately leaves `FACT_LAST_SUCCESSFUL_SYNC_PULL` unset; test `packages/facility-server/__tests__/sync/facilityBootstrap.test.js:87` ("leaves the pull cursor alone"). `specs/sync/bootstrap.md` "Applying the bootstrap".
- Pulled again: yes. Because the cursor is unset the first sync pulls from -1 and overwrites each bootstrapped row (spec: "overwrites each bootstrapped record with its version at that sync"). Re-applying a bootstrap replaces rows (test `:71`).
- Tests: facility `facilityBootstrap.test.js` (saved as pulled, sensitive network, re-apply, deleted rows, cursor untouched, atomic failure, login works) and `FacilitySyncManager-bootstrap.test.js` (ordering, once per process, retry on failure); central `facilityBootstrap.test.js` (contents, no patient data, one snapshot, authorisation). I found no test that exercises bootstrap followed by a full first sync, or bootstrap against a lookup-table-backed pull; `inference` from reading the test names, not a full search of the whole suite.
- A failed bootstrap never blocks sync (`F:280-282`).
Why: n/a.
Notes: the transcript's concern about ticks is answered: they are never compared, because the first pull overwrites everything from -1.

### FAC-32 UI fix (progress) would be preferable to bootstrapping, since there are no patients after bootstrap
Source: Part 3 00:58:28, 00:59:40
Verdict: partly
Evidence: PR #11305 added `isSettingUp` to the ping route (`packages/facility-server/app/routes/apiv1/index.js:114-122`, `serverConfig.js:112`) and a "Setting up this facility" screen (`packages/web/app/App.jsx:77`, polling every 10 s, `useCheckServerAliveQuery.js:10`) alongside the bootstrap. Progress on that screen is a separate card (PR text).
Why: the PR describes login being refused "as if the user had no access" until the first sync finished.
Notes: this is a product decision, not something the code settles.

### FAC-33 `CentralServerConnection` is thin; central may sleep, so it waits for central to wake (staging only)
Source: Part 3 00:59:40, 01:01:14
Verdict: partly
Evidence: it is a `TamanuApi` subclass (`CentralServerConnection.js:23`). Waking is handled by `whenCentralWakes` (`:16-21`): only HTTP 503 with a non-empty `Retry-After` header counts. It is attached only to the session start call (`:151`), which includes the login it triggers. The result is `{ status: 'centralWaking' }` with no session, so `runSyncSession` returns `{ queued: true, ran: false }` (`F:207-211`) and the run is recorded as queued; nothing waits and the next scheduled sync tries again. A bare 503 is an ordinary failure. Spec: `specs/sync/waking-central.md`. Supervisor `final-sync` (`routes/supervisor.js:25`) reports queued as "Sync was queued by the central server".
Why: spec note: a 503 without `Retry-After` is an overloaded central or empty proxy, which says nothing about when to retry.
Notes: nothing in facility code limits this to staging; whether central sleeps is a deployment matter. Calls after session start (push, pull) have no waking handling.

### FAC-34 Poll-until-true pattern when not streaming
Source: Part 3 01:02:16
Verdict: confirmed
Evidence: `CentralServerConnection.js:91-93` `pollUntilTrue` calls `TamanuApi.pollUntilOk` (`packages/api-client/src/TamanuApi.ts:639-660`): one request per second, up to 12 hours (`60*60*12` attempts), returning the first truthy response. Used for session ready (`:180`), pull ready (`:222`) and push complete (`:249`, always, even when streaming). When polling, the new tick and pull metadata are fetched separately (`:181-183`, `:224`).
Why: central does the slow work in the background; comments at `:158-160` (session start may block on another client's persist) and `:201-202`, `:247-248`.
Notes: each poll is itself a request with the default 10 s timeout and retry backoff (brief item 10).

### FAC-35 Facility drops previous snapshot tables, then pushes; sets the current sync tick at the start and waits for pending edits on the tick before
Source: Part 3 01:02:16
Verdict: confirmed
Evidence: `F:217` (`dropAllSnapshotTables`), `F:285-295`.
Why: comments at `F:286-291`, and `waitForPendingEditsUsingSyncTick.ts:3-5`.
Notes: detail in brief item 3.

### FAC-36 Two phases: point-in-time copy of all records to push, then push in batches
Source: Part 3 01:03:52
Verdict: confirmed
Evidence: `F:297-324` (snapshot at `F:304`, push at `F:322`). Comment `F:297-300`.
Why: see FAC-04.
Notes: none.

### FAC-37 Outgoing changes stay in memory; no sync filter from facility to central; all push and bidirectional models pushed; page limit not size-based
Source: Part 3 01:03:52, 01:05:01, 01:09:44
Verdict: confirmed
Evidence: FAC-05, FAC-06, FAC-10. `calculatePageLimit.js:28` divides by a record count.
Why: n/a.
Notes: "we fixed that in some of the other dynamic limiters" cannot be settled from the facility code; the only limiter in the facility is this one (mobile mirrors it).

### FAC-38 `concat` copying in `snapshotOutgoingChanges` (and a spread in the bootstrap) is a memory and performance risk
Source: Part 3 01:05:01, 01:07:21, 00:55:45
Verdict: outdated
Evidence: now `for (const change of changesForModel) outgoingChanges.push(change)` (`snapshotOutgoingChanges.js:57`) and `for (const record of ...) records.push(record)` (`buildFacilityBootstrap.js:85-87`). Commit `61ece78060`, PR #11763 "pre-emptively avoid `RangeError` when building large arrays", 2026-11-20.
Why: `concat` copies both arrays each time; a spread of a huge array can throw `RangeError`.
Notes: the underlying characteristic remains: each model's changed rows are loaded whole by one `findAll` (`snapshotOutgoingChanges.js:9-14`), mapped to a second array, and the full list stays resident until the push finishes. See Q3 below.

### FAC-39 Changelog attach is shared code, selects `logs.changes` in batches by tick greater than the cursor with an optional max; central passes a max, facility does not
Source: Part 3 01:08:27
Verdict: partly
Evidence: `packages/database/src/utils/audit/attachChangelogToSnapshotRecords.ts:14-58`: batches of `runFunctionInBatches` (default 10,000 snapshot records, `packages/utils/src/runFunctionInBatches.ts:1`), query `WHERE updated_at_sync_tick >= ?` and optional `<= ?`, restricted to `(table_name, record_id) IN (VALUES ...)`, then grouped and set on `snapshotRecord.changelogRecords`. Facility call: `F:312-321` with `minSourceTick: pushSince` and no max. Central: `CentralSyncManager.js:730-733` passes both.
Why: n/a.
Notes: `>=` versus `>` means changelog rows exactly at the previous cursor are sent again; central's insert tolerates that (`insertChangelogRecords.ts:13-17`, `ignoreDuplicates`). The attach runs after, and outside, the repeatable-read snapshot, so a changelog row written after the snapshot can ride along with an older row version (`inference`). The query shape (`IN (VALUES ...)` on `logs.changes`) is the kind `llm/project-rules/coding-rules.md` asks authors to justify; I did not check its plan.

### FAC-40 Page limit assumes all records are about the same size
Source: Part 3 01:09:44
Verdict: confirmed
Evidence: FAC-10.
Why: n/a.
Notes: none.

### FAC-41 A fourth direction, push to central then delete: attachments, certificate notifications, patient communications
Source: Part 3 01:09:44
Verdict: confirmed (with one more model)
Evidence: `packages/constants/src/sync.ts:3-9` defines five values: `do_not_sync`, `push_to_central`, `push_to_central_then_delete`, `pull_from_central`, `bidirectional`. Push-then-delete models: `Attachment` (`models/Attachment.ts:23`), `CertificateNotification` (`:41`), `PatientCommunication` (`:57`) and `FacilitySettingMigration` (`:27`), all under `packages/database/src/models/`. After a successful push `deleteRedundantLocalCopies` hard-deletes them: `packages/facility-server/app/sync/deleteRedundantLocalCopies.js:7-21` (`force: true`, by id, for the ids in the pushed `outgoingChanges`), called at `F:323`.
Why: `CertificateNotification.ts:38-40`: "if this changes to bidirectional, the SendCertificateNotification task will need to be updated / limited to handle only new publishes", meaning central tasks process these rows and a facility copy would be processed twice. `FacilitySettingMigration.ts:7-11`: a transient carrier that "drains off the facility once pushed". Added for patient communications by PR #7190. Attachments: speaker says "expected to be central-only" (no code comment found).
Notes: the delete is by id with no check that the row is unchanged since the snapshot, so an edit made between snapshot and delete would be removed unpushed (`inference`). Pulled models are `pull_from_central` plus `bidirectional` (`getModelsForDirection.ts:14-18`).

### FAC-42 Why push-then-delete: central acts on the record and updates its status; a stale facility copy would be incoherent ("a queue for central")
Source: Part 3 01:09:44, 01:10:51
Verdict: confirmed as intent for communications and certificate notifications (see the comment above); not stated anywhere for attachments.
Evidence: FAC-41.
Why: as above.
Notes: none.

### FAC-43 Pull: create snapshot table, pull or stream depending on mode, initiate pull then page with the dynamic limiter into the snapshot
Source: Part 3 01:10:51
Verdict: confirmed
Evidence: `F:338-347` creates the table and picks `streamIncomingChanges` or `pullIncomingChanges` from `centralServer.streaming()`, which is `Boolean(loginData.settings.sync.streaming.enabled)` (`CentralServerConnection.js:125-127`). The setting is central's `sync.streaming.enabled`, default false, exposed to clients (`packages/settings/src/schema/central.ts:232-239`). Both call `initiatePull` first (`pullIncomingChanges.js:22`, `:85`), which POSTs `pull/initiate`, waits for ready (stream or poll), and returns `{ totalToPull, pullUntil }` (`CentralServerConnection.js:194-225`). Polling pull then loops `centralServer.pull` with an opaque `fromId` of base64 `{sortOrder, id}` (`:45-46`); streaming pull follows `sync/<session>/pull/stream`, resuming from the last message id (`:107-115`).
Why: streaming exists to avoid per-page request overhead and polling latency (`inference`).
Notes: `streaming()` reads login data cached at the last full login; `connect()` returns early when a token refresh succeeds without updating it (`CentralServerConnection.js:95-103, 117-123`), so a changed setting takes effect on the next full login (`inference` from the code). Streaming does not pause (FAC-44) and its snapshot writes are started in the background without a concurrency cap (`pullIncomingChanges.js:116-120, 140`). Polling returns `totalPulled: totalToPull` (`:76`), the announced count, whereas streaming returns the counted total (`:143`); the only consumer is the `> 0` check at `F:359`.

### FAC-44 A pause between persisted batches in milliseconds; the PR says why (resource hogging?)
Source: Part 3 01:10:51
Verdict: partly
Evidence: two separate pauses, both default 50 ms (`packages/facility-server/config/default.json5:25-26`):
- `sync.pauseBetweenCacheBatchInMilliseconds`: used while pulling pages into the snapshot table, after each insert chunk of `persistedCacheBatchSize` (default 10000) (`pullIncomingChanges.js:14,66-70`). Polling mode only.
- `sync.pauseBetweenPersistedCacheBatchesInMilliseconds`: used while saving from the snapshot into real tables (`saveIncomingChanges.ts:23,175`) and between changelog inserts (`insertChangelogRecords.ts:9,36`).
Why: PR #4659 ("SAV-83: Add gap between persisted batches when pulling"), commit `074162d913`. The PR could not reproduce the reported lag, but concludes "it is still likely because the connection pool got exhausted", and that adjustable batch size and pause "should able to get some gap time to free up and allow active usage to be able to happen". The same PR cut `persistUpdateWorkerPoolSize` to 5 (`config/default.json5:27`, used by `saveChanges.ts:21,70`). So the reason is letting foreground use (web requests) get connections while a large sync persists, stated as likely, not proven.
Notes: the PR title says "when pulling" and the two pauses were added together, which is why the transcript conflates them.

### FAC-45 Initiate pull is one line that takes a long time; central snapshots, the facility polls until ready, then streams
Source: Part 3 01:12:34
Verdict: confirmed
Evidence: FAC-43.
Why: n/a.
Notes: none.

### FAC-46 The check for a record updated locally between push and pull: on by default; it was turned off for a while because it fired too much
Source: Part 3 01:12:34
Verdict: partly
Evidence: flag `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` in facility config, default `true` (`packages/facility-server/config/default.json5:28`), read live at `F:349` (not at module load; tests override it, `FacilitySyncManager-edgecases.test.js:246,286`). History: added off or on by PR #4599 (SAV-286, Sept 2023); switched off by default in releases by PRs #5519 and #5520 (SAV-601, March 2024); switched on again by PR #8326 (TAMOC-171, Aug 2025: "tested this for a couple weeks" on a large deployment with no issues). PR #11269 (Oct 2026) removed an `is_deleted IS FALSE` filter so pulled deletes are covered; PR #11314 (Oct 2026) changed `COUNT(*)` to `EXISTS` for performance.
Why: the reason it was switched off is not in the PR bodies (`unverifiable`); the speaker's "firing too much because of other issues" is not contradicted.
Notes: a config file key, not a setting, so it cannot be changed from the admin panel or per facility without editing config.

### FAC-47 Interrupted often at one site; speaker's hypotheses (single-place edits; cloud failover machine)
Source: Part 3 01:13:57, 01:15:03
Verdict: unverifiable (operational)
Evidence: what the code settles is the trigger condition: any row in a pulled model with `updated_at_sync_tick > lastSuccessfulPush` that also appears in the incoming snapshot, whether or not the local edit was made by a person (`assertIf...js:17-25`). The cursor compared is the pre-session tick (FAC-15), and snapshotting is not bounded above (`snapshotOutgoingChanges.js:10`), so a local write stamped with the new tick that was captured and pushed in this very session still trips it on a conflicting pull (`inference`). Any background writer on the facility (scheduled tasks that update synced rows) counts as a local edit; I did not enumerate them.
Why: n/a.
Notes: site-specific investigation is outside the code.

### FAC-48 Progress timestamps "recorded outside the save transaction so it is visible while the save runs"
Source: Part 3 01:15:59
Verdict: confirmed
Evidence: `F:356-357` (`persistStartedAt`) and `F:373` (`persistCompletedAt`), via `recordSyncRunProgress`, which swallows failures with a warning (`F:166-175`). Tests `FacilitySyncManager.test.js:561, 605`.
Why: so a sync stuck while saving can be told from one stuck exchanging with central (`specs/sync/run-history.md`).
Notes: none.

### FAC-49 Saving incoming changes uses the same patterns as central
Source: Part 3 01:15:59
Verdict: confirmed, with facility-specific differences
Evidence: shared `saveIncomingChanges` (FAC-13). Facility differences: no field merge, trust incoming (FAC-01); restores allowed only on the facility side (`saveIncomingChanges.ts:69-72`); `deletedAt` from the payload is discarded and decided only from `isDeleted` (`:34-44`); audit paused (brief item 7).
Why: n/a.
Notes: none.

### FAC-50 Convergence of the sync user and the settings PSK pull run after the session, must not fail the sync, retry next time
Source: Part 3 01:15:59, 01:17:13
Verdict: confirmed
Evidence: `F:240-257`: after `endSyncSession`, `convergeSyncUser` then `pullSettingsPsk`, each in its own `try`, failure logged at `warn`. They run only on a session that completed (the earlier `catch` rethrows). Tests `FacilitySyncManager.test.js:114-215`.
Why: comment `F:240-242` and PR #10586: provisioning that needs central must not depend on the network at upgrade time, and the sync already needs central; ordering matters because "the PSK read is served to a dedicated sync user only, so the swap has to land first".
Notes: both run on every successful sync but are cheap no-ops once done (below).

### FAC-51 `convergeSyncUser` swaps a human admin's config credentials for a dedicated per-device sync user
Source: Part 3 01:17:13, 01:18:30
Verdict: confirmed
Evidence: `packages/facility-server/app/sync/convergeSyncUser.js:17-62`. Returns early if the authenticated account's `kind` is unknown or already `sync` (`:20-21`), or if the recorded sync email differs from the account in use, meaning the swap already happened and this process is behind (`:28-29`), or if device id or facility ids are missing (`:34-37`). Otherwise POSTs `admin/syncCredentials` with `deviceId` and `facilityIds`, stores the new email as a fact and password as a secret in one transaction (`:50-53`), re-reads server config (`:55`) and clears the token so the next call authenticates as the new user (`:58`).
Why: header comment `:12-16` and PR #10586: facilities configured before the setup wizard "sync as a human admin whose credentials came from config"; central serves the settings PSK to `kind: sync` only, because `manage:all` alone does not prove the caller is a facility server. "Runs on sync rather than on upgrade so a facility that was offline during its upgrade still converges." Provisioning rotates the password, which is why it acts only on a positive answer (`:18-19`).
Notes: it is not specifically about the wizard: it exists for facilities set up before the wizard. New wizard installs already have a sync user (`setup.js:178-190`).

### FAC-52 `pullSettingsPsk` fetches the deployment-wide settings key from central
Source: Part 3 01:18:30
Verdict: confirmed
Evidence: `packages/facility-server/app/sync/pullSettingsPsk.js:9-26`: returns if a key is already stored; else `GET admin/settingsPsk`, refuses an empty value (it would be stored permanently by `setIfAbsent`), stores it and clears the cached key (`clearSettingsPskCache`) so no restart is needed.
Why: `packages/constants/src/facts.ts:56-60` and `specs/administration/settings/secret-encryption.md`: settings (including secret integration credentials) sync central to facility, so a per-host key could not decrypt them; central generates the key and facilities never do.
Notes: none.

### FAC-53 "Nowhere clarifies what PSK means"
Source: Part 3 01:17:13, 01:18:30
Verdict: wrong
Evidence: `packages/constants/src/facts.ts:56` ("Deployment-wide pre-shared key that encrypts integration secrets in the settings table") and `specs/administration/settings/secret-encryption.md:12` ("a single pre-shared key (the settings PSK) for the whole deployment, distinct from the per-server key that protects a server's own local secrets"). PR #10586 uses the abbreviation without expanding it.
Why: n/a.
Notes: so PSK here is "pre-shared key" (symmetric, one per deployment), not a pairing code or anything about the sync protocol.

## Open questions answered

1. How are incoming and outgoing distinguished in the snapshot schema? A `direction` text column on one table per session (FAC-08, `manageSnapshotTable.ts:41`).
2. Are client push snapshots in memory or the database? In memory (FAC-06).
3. How does a sync start, what is the schedule, and what happens when one is requested during a running sync? See below (question 1 of the brief).
4. Was the `concat` / spread concern real? Yes and fixed by PR #11763 after the sessions (FAC-38).
5. What does PSK stand for? Pre-shared key (FAC-53).
6. What does the pause PR say? FAC-44.
7. Is bootstrap needed or would a UI fix do? Not decided by code; PR #11305 shipped both a bootstrap and a "setting up" screen without progress (FAC-32).
8. What regression testing does bootstrap have? FAC-31 lists the tests; none found that run bootstrap into a full first sync.

### Brief item 1: how syncs start
- Schedule: `sync.schedule`, a config key (not a setting), default `*/1 * * * *`, with `sync.jitterTime` `1s` and `sync.enabled` `true` (`packages/facility-server/config/default.json5:10-12,29-30`; `packages/facility-server/app/tasks/SyncTask.js:13-17`). The task also runs once immediately on start (`SyncTask.js:19-24`). It calls `triggerSync({ type: 'scheduled', urgent: false })` and no-ops until the sync runtime is configured (`:27-34`). `ScheduledTask` skips a tick if the previous run is still going (`packages/shared/src/tasks/ScheduledTask.js:104-111`) or tasks are held, so the schedule alone never queues a follow-up; only other callers do.
- User and event triggered: web "sync now" (`POST /sync/run`, `type: userRequested`, urgent, UI races a 10 s timeout), marking a patient for sync (`type: patientMarkedForSync`, urgent, the HTTP response waits for the sync), supervisor `finalSync`, and the `sync` subcommand (urgent, loops while queued). They reach the sync process over `FacilitySyncConnection` (`POST /sync/run`, localhost only, retried up to 4 times; `FacilitySyncConnection.js:10,40-48`). The route list is guarded by `TRUSTED_ENDPOINTS` (`routes/sync/sync.js:18-24`).
- Disabled: `triggerSync` returns `{ enabled: false }` (`F:89-92`).
- Urgency: sent to central only at session start; central orders its queue urgent-first (FAC-20).
- In-process queueing (`F:88-126`): idle, so run now; running with no follow-up, so create one (`waitForCurrentSyncAndTriggerNextSync`) and wait for it; running with a follow-up already queued, so wait for that one. Why: a patient marked while a sync is mid-flight was not in that sync's snapshot, so the caller needs a run that begins after the request, but a hundred callers need only one such run (FAC-17, FAC-19). Caveats: the follow-up has no reason or urgency (FAC-20); if the running sync fails, queued callers get the failure and no follow-up runs (FAC-21).

### Brief item 2: `runSync` step by step (`F`)
1. `triggerSync` (`F:88-126`) sets `currentSyncPromise = runSync()` and clears state in `finally`.
2. `runSync` (`F:128-156`) refuses to run if a current promise exists, creates the `SyncFacilityRun` row (`F:138-141`), runs the session, then records `queued`, `succeeded` or `failed` (`F:143-155`).
3. `runSyncSession` (`F:177-267`): require sync email and password (`:178-181`), record start time (`:183-184`).
4. Read pull cursor, default -1 (`:191`).
5. Bootstrap if the cursor is unset and this process has not bootstrapped (`:193-195`; method `:273-283`).
6. `startSyncSession` with `urgent` and `lastSyncedTick = pullSince` (`:198-205`); central may answer queued or waking (`:207-211`, returns `{ queued: true, ran: false }`); otherwise wait for ready (stream or poll) and get the new tick (`CentralServerConnection.js:138-184`).
7. Record `sessionId` on the run row (`:214`).
8. Drop and recreate schema `sync_snapshots`, removing every earlier session's table (`:217`).
9. Push (`:225`, method `:285-328`): read current tick T; set current tick to the new tick; wait for pending edits on T; snapshot; attach changelogs; push pages and complete; delete redundant local copies; save push cursor T.
10. Pull (`:227`, method `:330-374`): create snapshot table; initiate pull; page or stream into the snapshot; optional assert; record `persistStartedAt`; one transaction: pause audit, deferred constraints, save all models, save pull cursor; record `persistCompletedAt`.
11. `endSyncSession` (`:228`).
12. On error (`:229-234`): if not a `Problem` with a response (a local error), `markSessionErrored`; rethrow. `finally` drops this session's snapshot table (`:235-238`).
13. Post-sync steps (`:243-257`): `convergeSyncUser`, then `pullSettingsPsk`, each swallowed on failure.
14. Record duration and `lastCompletedAt`, return `{ queued: false, ran: true }` (`:259-266`).

### Brief item 3: push in detail
- Tick advance: `pushChanges` reads the current tick as `currentSyncClockTime` (`F:287`), then immediately sets `FACT_CURRENT_SYNC_TICK` to the tick central issued for the session (`F:292`). Central's tick is the odd half of its tick/tock pair (`CentralSyncManager.js:127-134`). Every local write after this point is stamped with the new tick by the trigger (`set_updated_at_sync_tick`, latest definition `packages/database/src/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:36-68`).
- Which tick is waited on and why: the old tick (`F:295`), via `pg_advisory_xact_lock(old tick)` (`waitForPendingEditsUsingSyncTick.ts:6-14`). The trigger takes a shared transaction lock on whatever tick it stamps (`pg_try_advisory_xact_lock_shared`, in the function above), so the exclusive lock blocks until every transaction that wrote a row with the old tick has committed or rolled back. Without that, a row stamped with the old tick could commit after the snapshot and sit below the cursor forever. Pinned by `FacilitySyncManager-edgecases.test.js:36-100`. The query runs outside a transaction, so its lock is released at once; new writers use the new tick and are not blocked. (`getSyncTicksOfPendingEdits.ts` is used by central only.)
- Snapshot: repeatable read (FAC-04), rows with tick greater than the push cursor, no upper bound, so rows written mid-sync with the new tick may be included and will be pushed again next time (their tick is above the cursor T).
- Memory: whole snapshot in an array (FAC-06). Size risk: no comment on the facility side; the speaker's example is a long offline period (`inference` that it is the realistic worst case). Spreads and concats were removed by #11763, but one `findAll` per model still materialises that model's whole diff, then a mapped copy, then changelogs.
- Changelogs: FAC-39.
- Page limit: FAC-10 (records, 10 initial, 2000 ms target, caps in config). `pushOutgoingChanges.js:6-17` posts each page, then `completePush` polls until central finishes persisting.
- Cursor: `F:326` sets `FACT_LAST_SUCCESSFUL_SYNC_PUSH = T` (the old tick), after `completePush` and `deleteRedundantLocalCopies` returned, even for an empty push, and before the pull. Not in a transaction. If push throws, it is not moved.

### Brief item 4: directions from the facility's side
- `push_to_central`: snapshotted and pushed (e.g. `ReportRequest`, `IPSRequest`, `UserLoginAttempt`, `DeathRevertLog`); never pulled.
- `pull_from_central`: only pulled (reference data, users, settings, facilities, etc.).
- `bidirectional`: pushed and pulled.
- `push_to_central_then_delete`: pushed, then hard-deleted locally (FAC-41). Models: attachments, certificate notifications, patient communications, facility setting migrations.
- `do_not_sync`: neither (e.g. `SyncFacilityRun`, which also has no `updatedAtSyncTick`; `Model.ts:63`).
- `getModelsForPush` and `getModelsForPull` pick the sets (`getModelsForDirection.ts:14-25`).

### Brief item 5: pull in detail
- Snapshot table: `sync_snapshots."<sessionId>"`, created at `F:338`, receives only `incoming` rows.
- Polling versus streaming: `sync.streaming.enabled` central setting via login response (FAC-43).
- Pause: FAC-44.
- Cursor: `pullUntil` from central's pull metadata is saved by `LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, pullUntil)` at `F:371`, inside the same `sequelize.transaction` as `saveIncomingChanges` (`F:358-372`), and it is saved even when nothing was pulled. Comment `F:367-369`: if setting the cursor fails, the saves roll back, so the facility does not later treat them as local edits needing a push when it resyncs from the same old cursor.

### Brief item 6: the abort (FAC-02, FAC-46)
- Checks: for each pulled model, does any incoming snapshot row join (by `record_id::text = id::text` and `record_type`) to a local row whose `updated_at_sync_tick` is above the stored last-successful-push value? Includes pulled deletes (#11269). `EXISTS` form from #11314 (an `EXISTS` instead of `COUNT(*)` so it stops at the first hit). Runs one query per pulled model, serially (`assertIf...js:43-47`).
- Control: config `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot`, default `true`.
- When it fires: throws before the save transaction, nothing pulled is saved, pull cursor unchanged, central told the session errored, the run row is `failed`, the caller gets an error, the push cursor stays advanced, and the next sync pushes the edit first.
- Why: central is the only place conflicts are resolved; the facility must not overwrite a local edit with a central version central has not seen, and cannot choose between them itself (FAC-01, FAC-02). The header comment also notes pulled deletes are persisted with the not-to-push sentinel, so an overwritten local edit and its changelog would never reach central.
- PR #11314: performance only (COUNT to EXISTS), message wording changed from "There are N records" to "Some X record was updated".

### Brief item 7: saving pulled records without marking them as local edits
- On the way into the snapshot, `data.updatedAtSyncTick` is set to `-1` (`SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER`, `constants.ts:17-22`) at `pullIncomingChanges.js:56` and `:96`; bootstrap does the same (`facilityBootstrap.js:29`).
- `saveChanges.ts:1-12` explains soft deletes and restores ride the same INSERT or UPDATE so the tick lands with them; saving through a separate `destroy()` or `restore()` would let the trigger stamp the current tick and echo central's delete back.
- The trigger `set_updated_at_sync_tick` (BEFORE INSERT OR UPDATE; latest definition migration `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`) turns `-1` into `-999` (`LAST_UPDATED_ELSEWHERE`, "last written elsewhere, do not push") and stamps anything else with the current tick. Note: the comment inside the trigger about "-999 when other fields are updated without the tick being altered" is stale: the `ELSE` branch re-stamps every row that is not `-1`, including updates that left the column alone.
- Audit: `pauseAudit` (`F:360`) sets the transaction variable `audit.pause` (`packages/database/src/utils/audit/pauseAudit.ts`), which makes `logs.is_audit_changes_enabled()` false (migration `1778000000000-retireAuditChangesEnabledSetting.ts:7-18`), so triggers write no `logs.changes` rows for the pulled saves. Central attaches the original changelog rows to each pulled record; the facility stores them in `changelog_records` in the snapshot, `extractChangelogFromSnapshotRecords` separates them and `insertChangelogRecords` inserts them with `ignoreDuplicates` (`saveIncomingChanges.ts:170-173`). Pinned by `FacilitySyncManager-integration.test.js:124` (no audit rows from an incoming sync) and `:218-290` (pulled records, deletes and restores are never pushed back). For push, changelogs travel with each record (FAC-39); a hard-deleted record's changelog is not pushed (`:186`).
- `pauseAudit` is only called when `totalPulled > 0` (`F:359-360`).

### Brief item 8: bootstrap
FAC-24 to FAC-32. In short: runs when the pull cursor is unset, once successfully per process, plus in the wizard; nine models; central reads the source tables with the old `buildSyncFilter` from `since = -1`, in one repeatable read transaction, not the lookup table; the facility saves as a pull would (-1 tick, audit paused, constraints deferred) in one transaction; the pull cursor stays unset so the first real sync pulls from the start and overwrites every bootstrapped row.

### Brief item 9
FAC-50 to FAC-53.

### Brief item 10: `CentralServerConnection`
- Class: `TamanuApi` subclass with defaults `timeout: config.sync.timeout` (10000 ms), `waitForAuth: true`, `backoff: true` (`CentralServerConnection.js:40-44`; config `default.json5:15`).
- Retries (`packages/api-client/src/fetchWithRetryBackoff.ts:12-82`): default 15 attempts, Fibonacci delay times 300 ms capped at 10 s (about 76 s of waiting in total before giving up). Only thrown transport errors are retried (a `RemoteUnreachableError`, rate limiting, other recoverable errors); a response with any HTTP status is returned, not retried, and 4xx, `CLIENT_INCOMPATIBLE`, invalid credentials and "Sync session" errors are never retried (`packages/errors/src/extractErrorFromFetchResponse.ts:15-44`). Login retries use `config.sync.backoff` (`default.json5:31-35`, same values) via `connect()` (`:95-115`).
- Timeout: each request aborts after `config.sync.timeout` (`packages/api-client/src/fetch.ts:42-48`).
- Auth: connect first tries a token refresh, then logs in with the sync email and password and scope `DEVICE_SCOPES.SYNC_CLIENT` (`:95-115`); on an auth error it reconnects once and repeats (`:79-88`).
- Poll-until-ready: FAC-34. Streaming alternative: `streaming()` plus `stream(...)` (FAC-43).
- Waking central: FAC-33.
- Version and device checks: every request sends `x-version` and `x-tamanu-client` (`TamanuApi.ts:391-394`); `login` rejects a server that is neither facility nor central (`:273-276`) and rejects a token whose device id differs from the one sent (`:283-290`); central answers a too-old or too-new client with a `CLIENT_INCOMPATIBLE` problem (not retried). The facility registers no incompatibility handler (no `setVersionIncompatibleHandler` call in `packages/facility-server/app`), so the error simply fails the sync run. Device id is also sent in the session start, pull-initiate and push-complete bodies (`CentralServerConnection.js:142-145,198,244`), and central requires a device (`buildSyncRoutes.js:62-91`; test "refuses a request without a sync client device").
- `faithFetch` (`packages/facility-server/app/sync/faithFetch.js`): replaces node's `fetch` for this connection (`CentralServerConnection.js:47-49`) with `@passcod/faith`, a Rust fetch with DNS cache and HTTP/2, loaded lazily (`faithFetch.js:3-9`). PR #10656 gives the reason: sync is "thousands of small requests over links that are often slow". It maps known network errors to `Error('faith: <code>')` with the cause attached so long Rust error chains do not flood logs or the stored sync error (`:11-22`). Disabled with env `TAMANU_DISABLE_FAITH_FETCH=true`, an env var rather than a setting because facility settings only arrive by sync (PR text).
- A separate, shorter retry layer sits between the API and sync processes: 4 attempts, no request timeout (`FacilitySyncConnection.js:7-10, 25-48`).

### Brief item 11: run history
FAC-23. Created before anything else in `runSync` (`F:138-141`) with `triggerType` (the reason's `type` only) and `urgent`; `sessionId` set once issued (`F:214`); `persistStartedAt` and `persistCompletedAt` around the save (`F:357, 373`); completed with `succeeded`, `queued` (no session) or `failed` plus `error` message (`F:143-155`, `SyncFacilityRun.ts:64-66`). One row per run, shared by all callers piggy-backing on one follow-up (`FacilitySyncManager.test.js:364`). Never synced, indexed on `start_time` and `(status, start_time)`, kept forever. Failure to record never fails the sync (`F:158-175`). Spec `specs/sync/run-history.md`. A run whose process died stays `running` with no completion time (that is the intended alert signal).

### Brief item 12: snapshot tables from earlier sessions, crashes
- The only cleanup of old tables is `dropAllSnapshotTables` at `F:217`, which runs only after central has issued a session id (a queued or waking attempt returns first, `F:207-211`). It drops and recreates the whole `sync_snapshots` schema, so it also removes anything else in it. Comment `F:216`: "in case last session errored out or server was restarted". The finishing `finally` drops only the current session's table (`F:235-238`).
- After a crash or restart mid-sync: nothing is lost. Push not complete: push cursor unmoved, so the same rows are pushed again next time (central writes idempotently, speaker 00:36:48). Crash after central persisted but before `F:326`: same, re-push. Crash mid-pull: snapshot rows are orphaned, cursor unmoved, next sync pulls again. Crash mid-persist: the single transaction rolls back (`F:358-372`). The old central session is closed when the same device reconnects (`buildSyncRoutes.js:70-91`). The run row stays `running` (`F:138`). The in-memory promise state and `hasBootstrapped` reset with the process.

## Not in the transcript

- All facility sync tunables are config keys, not settings (`packages/facility-server/config/default.json5:10-42`: schedule, timeout, backoff, batch sizes, pauses, worker pool size, the assert flag, the dynamic limiter). That conflicts with `llm/project-rules/settings.md`, which says new tunables belong in settings, and means they cannot be set from the admin panel or per facility. The streaming switch is the exception: a central setting.
- The sync loop runs in a separate Node process from the API (`FacilitySyncConnection`, `createSyncApp`, `startApp.js:90-110`, `startAll.js:36-46`), with a localhost-only unauthenticated trigger (`routes/sync/sync.js:11-24`). The same `FacilitySyncManager` instance must be shared with `SyncTask` to avoid concurrent syncs (`startApp.js:98`).
- Marking a patient for sync blocks its HTTP response until the sync finishes (`patientFacility.js:26`), with no 10 s race, unlike the sync-now button; `FacilitySyncConnection` has no request timeout by design.
- The follow-up sync loses urgency and trigger type, and a failed running sync cancels the queued follow-up (FAC-20, FAC-21).
- Facility requests never name tables (`tablesToInclude` or `tablesForFullResync`), unlike the transcript's description of clients choosing tables (that is a mobile and central-supported feature).
- Both cursors are compared in the web app's "patient synced" check (`SyncState.jsx:44-54`), so changing what either cursor stores is a UI-visible change.
- Streaming pull has no pause and starts snapshot writes in the background without a cap (`pullIncomingChanges.js:116-120`), against `llm/project-rules/coding-rules.md` ("limit concurrency"). Polling pull applies the pause once per chunk.
- `pullIncomingChanges` returns the announced count, not the received count (`:76`); a short read just ends the loop on an empty page (`:40-43`).
- The save transaction wraps all pulled models and all pauses, so a very large pull holds one long transaction.
- `deleteRedundantLocalCopies` hard-deletes with no staleness check (FAC-41), and `dropAllSnapshotTables` drops the schema with `CASCADE` semantics (Sequelize `dropSchema`).
- The trigger comment about -999 is stale (Brief item 7).
- Existing tests worth knowing: `FacilitySyncManager-edgecases.test.js` (pending-edit wait, assert on/off, errors posted to central only for local errors), `FacilitySyncManager-integration.test.js` (audit pause, never pushing pulled rows), `snapshotOutgoingChanges.test.js`, `pushOutgoingChanges.test.js`, `pullIncomingChanges.test.js`, `deleteRedundantLocalCopies.test.js`, `calculatePageLimit.test.js`, `convergeSyncUser.test.js`, `pullSettingsPsk.test.js`, `CentralServerConnection.test.js`, `faithFetch.test.js` under `packages/facility-server/__tests__/sync/`. I did not open all of these.

## Unresolved

- Why the assert was switched off in March 2024: PR #5519 and #5520 bodies are one line; look at the linked SAV-601 ticket.
- Whether other dynamic limiters exist that count bytes (speaker at 01:09:44): central's side; search `packages/central-server/app/sync` and mobile for `calculatePageLimit` equivalents.
- The query plan of the changelog attach (`logs.changes ... IN (VALUES ...)`) on a large facility, against the indexing rules in `llm/project-rules/coding-rules.md`.
- Whether the sleeping-central path is exercised only on staging (deployment fact, not code).
- How often background facility tasks write to synced rows during a sync window, which would feed the assert; enumerate `packages/facility-server/app/tasks` writers if the repeated-abort question is pursued.
- Whether bootstrap followed by a full first sync is covered by any end-to-end test (searched only the named test files).
