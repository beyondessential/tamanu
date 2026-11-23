# Mobile client as a sync client

Ledger: `../ledger/08-mobile-client.md`. Code at `22d3edaa36`. `MSM` = `packages/mobile/App/services/sync/MobileSyncManager.ts`; `FSM` = `packages/facility-server/app/sync/FacilitySyncManager.js`; `CSC` = `packages/mobile/App/services/sync/CentralServerConnection.ts`. TypeORM source was not readable in the ledger run, so claims about TypeORM behaviour are `inference`.

## 1. Side by side

| Step | Mobile vs facility server |
| --- | --- |
| Trigger while syncing | Different: dropped, not queued. Facility coalesces to one queued next run [N1] |
| Credentials / bootstrap | Different: user's login token; no bootstrap. Facility has sync credentials and a one-off bootstrap [N1] |
| Session start | Different: sends `isMobile: true`, one facility id, device id. Facility sends all its facility ids [N1] |
| Queued by central | Same idea. Mobile sets `isQueuing`, emits `syncInQueue`, retries on next trigger; facility returns `{ queued: true }` [N1] |
| Marking changed rows | Different: TypeORM listener, no trigger (section 3) [N2] |
| Wait for pending edits | Absent. Facility uses `waitForPendingEditsUsingSyncTick` [N1, N2] |
| Outgoing snapshot | Different: SQLite `find()` per model; facility uses `REPEATABLE READ` raw reads [N1] |
| Changelog on push | Absent. Facility calls `attachChangelogToSnapshotRecords` [MOB-07] |
| Push compression | Different: gzip at 1 KiB or more. Facility sends uncompressed [N4] |
| Pull transport | Different: polled pages with prefetch. Facility streams when central supports it [N1] |
| Staging | Different: incremental only, attached SQLite file. Facility always stages, per-session Postgres table [MOB-30] |
| Initial vs incremental | Different: separate paths on mobile. Facility has one path [N1] |
| Save transaction | Same shape (one transaction, deferred constraints, cursor saved inside). Mobile defers foreign keys only; facility also pauses audit and defers unique constraints [N5] |
| Error reporting to central | Same purpose, different filter: mobile reports every failure; facility skips errors that came from central [N1, N11] |
| Audit log (`logs.changes`) | Absent on device; central's triggers write it when the push is persisted [MOB-07] |
| Progress | Mobile only: stages and percentages for a UI [N8] |
| Wake lock | Mobile only [MOB-28] |
| Schedule | Different: fixed 5 minutes on mobile; facility `sync.schedule` default every minute [N7] |

## 2. `MobileSyncManager`, step by step

Class in `MSM`.
1. `triggerSync`: returns if already syncing; runs `runSync`; emits `SYNC_SUCCESS` or `SYNC_ERROR`; `finally` resets state, emits `SYNC_STATE_CHANGED` and `SYNC_ENDED`, clears the urgent interval only if a sync started [N1].
2. `runSync` preflight: throws if syncing, sets `isSyncing`, awaits `Database.maintenanceInProgress` (reason, code comment: "so the session isn't held open waiting on the write lock"), drops a leftover snapshot table [N1, MOB-26].
3. Path choice: `pullSince` = `lastSuccessfulSyncPull` fact, -1 if absent; `isInitialSync = pullSince === -1`; stage table chosen from it [N1].
4. Start session (`CSC` session start): `POST sync` with `urgent`, `lastSyncedTick`, `facilityIds: [facilityId]`, `deviceId`, `isMobile: true`. No session id means queued: `isSyncing` false, `isQueuing` true, `SYNC_IN_QUEUE`, return. Else poll `sync/:id/ready`, read `startedAtTick` from `sync/:id/metadata` [N1].
5. `activateKeepAwake`, emit `SYNC_STARTED` [N1].
6. `pushChanges` (stage 1): read `currentSyncTick`, overwrite with session tick, read `lastSuccessfulSyncPush`, `snapshotOutgoingChanges`, if any `pushOutgoingChanges` then `completePush`, record count, set `lastSuccessfulSyncPush` to the old tick [N1].
7. `pullChanges` (stage 2): show 33% with the pausing message, read `tablesForFullResync`, `initiatePull` (returns `totalToPull`, `pullUntil`; polls until central's snapshot is built), then `pullInitialSync` or `pullIncrementalSync`; both end in `postPull` [N1].
8. End: `DELETE sync/:id` [N1].
9. Any failure in 6 to 8: `reportSyncError` posts `sync/:id/error` (best-effort, swallowed if it fails), rethrown [N1].
10. Cleanup: drop snapshot table, set `lastSuccessfulSyncTime`, reset progress, release keep-awake in `finally`. The snapshot table is not dropped on failure; step 2 does it next time [N1].

## 3. Marking local changes without triggers

Mobile has no database triggers at all [MOB-21].
- Marker: `updatedAtSyncTick` on every table, `@Column({ nullable: false, default: -999 })` in `BaseModelWithoutId.ts` [N2].
- Local writes: `assignUpdatedAtSyncTick`, a TypeORM `@BeforeInsert()` and `@BeforeUpdate()` listener on the shared base class, reads the `currentSyncTick` fact by query and assigns it. Push selects `updatedAtSyncTick > lastSuccessfulSyncPush` [N2].
- Soft deletes go through `updateValues`, which calls `save()`, so they get stamped [N2].
- Incoming records: written by hand-built SQL (`executePreparedInsert`, `executePreparedUpdate` in `saveIncomingChanges.ts`), no entity loaded, so no listener. `extractIncludedColumns` strips `excludedSyncColumns` (`createdAt`, `updatedAt`, `updatedAtSyncTick`), so the tick is never written: new rows take the default -999, updated rows keep their old tick. -999 is below every push cursor (starts at -1) [N2].
- `updated_at_sync_tick: -1` added in `pullRecordsInBatches.ts` is dead on the current path (excluded anyway); leftover of the entity-based save (`inference`) [N2].
- Batch-failure fallbacks (`repository.insert`, `repository.update` per row) carry no tick either way; whether TypeORM runs listeners on plain objects is `inference` [N2].
- Bypassing the listener: anything outside entity `save()`. Raw SQL certainly (all migrations; migrated rows keep their old tick, normally -999 [MOB-16]); bulk `update()`, `softDelete`, `softRemove`, builder writes are `inference`. Ledger found no such writes to synced tables in app code except hard `Attachment.delete` (push-only row) [N2].
- No pending-edit wait: nothing like `waitForPendingEditsUsingSyncTick`. `inference`: a save that reads the tick before the push swaps it (`MSM` tick overwrite) can be written with the old tick after the snapshot, then fall below the moved cursor and never push. Window is small (short saves, one connection) but unenforced [N2].
- Pulled row over a locally edited row: tick untouched, so the row keeps its high tick and is pushed back with central's values; central does not compare ticks on mobile pushes. A local edit between push snapshot and pull save to a row central also changed is lost (`inference`, no test) [N2].

## 4. Mobile's tick and cursors

- Stored in SQLite `local_system_facts` (`LocalSystemFact`, `DO_NOT_SYNC`), keys `currentSyncTick`, `lastSuccessfulSyncPush`, `lastSuccessfulSyncPull`; missing means -1; written by `setSyncTick`. Key column unique since a dedupe migration [N3].
- `currentSyncTick`: advanced once per session at push start, to the tick central issued. Local writes read it, never advance it [N3].
- `lastSuccessfulSyncPush`: set to the previous tick after push completes [N3].
- `lastSuccessfulSyncPull`: set to `pullUntil` inside the save transaction (`postPull`) [N3].

## 5. Push

- Snapshot (`snapshotOutgoingChanges.ts`): inside a SQLite transaction, per push or bidirectional model, `find({ where: { updatedAtSyncTick: MoreThan(since) }, withDeleted: true, loadEagerRelations: false })`, `extractIncludedColumns`, then optional `sanitizeRecordDataForPush`. One row per changed record, so intermediate edits collapse [N4, MOB-08].
- Whole snapshot held in memory [MOB-04]. #11156 dropped eager relations (13 joins per additional-data row, discarded anyway); #11181 builds one array instead of `concat` per model [N10].
- Excluded: `createdAt`, `updatedAt`, `updatedAtSyncTick`, and `filePath` for attachments. `deletedAt` is pushed with `isDeleted`; central discards it for mobile and decides delete or restore itself [N4].
- Sanitisers (push and pull): `Prescription`, `EncounterHistory`, `PatientAdditionalData`, `Setting`, `PatientFieldDefinition`, `AdministeredVaccine`, `PatientContact`. Mostly JSON-to-string conversion and field renames, not data-safety filtering [Open questions].
- Compression (#10795): push only. Body of 1024 bytes or more is sent as a pre-serialised string with `Content-Encoding: gzip`; React Native gzips string bodies natively and drops the header for other body types (`compressibleRequestBody.ts`). Central inflates [N4].
- Paging: dynamic limiter, initial 10,000, min 1,000, max 40,000, 30% change per page, target 10 s [N4]. Settings come from the login response, not the pulled `settings` table [N4].
- Finish: `completePush` posts pushed tables, polls `push/complete` each second up to 12 hours [N4].
- Mobile pushes only `Note`, `VitalLog`, `Attachment`; pushed attachments stay on device (TODO in `models/Attachment.ts`) [N4, N9].
- Central persists with the same tick-tock as for facilities; no mobile branch [MOB-10]. Central skips `pauseAudit` for mobile so its triggers write `logs.changes`, attributed to the user whose `push/complete` request started the persist (normally the signed-in clinician, not necessarily the editor); propagation into the un-awaited promise is `inference` [MOB-07, MOB-09].

## 6. Pull

- Tables asked for: `getTableNamesForDirection` at pull start becomes `tablesToInclude`; central filters its snapshot to them. Mobile models are mostly `PULL_FROM_CENTRAL` reference and config tables plus patient data [MOB-06].
- Patients: those with a `PatientFacility` row for the device's one facility, plus newly marked patients' full history. Every device at the facility pulls the same set [MOB-03, N9].
- Download (`pullRecordsInBatches.ts`): pages by cursor `{ sortOrder, id }` base64, prefetches next page while saving, stops on empty page or `recordTotal`. Records for tables with no pull model are silently dropped [N5].
- Incremental (`pullIncrementalSync`): zero records only advances the cursor (#11092); else create `snapshot.sync_snapshot`, download into it (stage 2), then one save transaction reading it in batches, then `postPull` (stage 3) [N1, N5].
  - Staging: attached throwaway file `tamanu-sync-snapshot` (schema `snapshot`), `journal_mode OFF`, `synchronous OFF`, `auto_vacuum FULL`, recreated if unreadable. Reason (#11176, `snapshotDatabase.ts`): keep staging writes out of the main journal; a failed sync just drops it and re-pulls; about 16 s faster for 1M records on an emulator. A real table in a file, not a `TEMP` table [MOB-19, MOB-29, N5].
  - Table: fixed name, `id` plus `data` JSON text of up to `maxRecordsPerSnapshotBatch` records per row; no direction, no indexes, incoming only. Facility staging is one row per record with indexes [MOB-30].
- Initial (`pullInitialSync`, `lastSuccessfulSyncPull` -1): no staging; one transaction around download and save, each page inserted as it arrives; stages 33 then 100; optional unsafe pragma; inserts only except `User`, which uses insert-or-update because the signed-in user's row exists (reason `inference`) [MOB-33, N5].
- Unsafe pragma: `Database.setUnsafePragma` (`journal_mode OFF`, `synchronous 0`, `locking_mode EXCLUSIVE`, `temp_store MEMORY`), still present, behind `mobileSync.useUnsafeSchemaForInitialSync` (default false, group `highRisk`). No rollback while on. Why it stopped being default is unknown [MOB-31, MOB-32].
- Foreign keys: `PRAGMA defer_foreign_keys = ON` for the whole save transaction (#9044, self-referencing rows), so order does not matter. SQLite fails `COMMIT` on any violation; only then `checkForeignKeys` runs `PRAGMA foreign_key_check` to name the records (#10308, #11183). `runSyncSaveTransaction` drives the query runner directly because TypeORM's `transaction()` rolls back before the callback sees the commit error [N5, N10].
- Batch insert and fallback (`executePreparedQuery.ts`): multi-row insert, sizes clamped to the SQLite variable limit (32,766, `limits.ts`). If it fails, rows are retried one by one sequentially so a bad row is named (#10960). The update fallback still uses `Promise.all` (same race shape, flagged in review) [N5, N10].
- Tombstones (#10350): central sends `isDeleted`; `buildFromSyncRecord.ts` sets `deletedAt` to the current local datetime, else `null`. An incoming non-deleted version undeletes a locally soft-deleted row. The time is device time, not central's [N5].
- Cursor: `lastSuccessfulSyncPull = pullUntil` saved in the save transaction; a failed commit leaves no cursor and no rows [N5].

## 7. Tables for full resync

- Request: a migration calls `triggerFullResync(queryRunner, tables)` (`migrations/utils/triggerFullResync.ts`), inserting local fact `tablesForFullResync`, comma-separated table names (not model names). Callers: the procedure-tables migration (reason in its comment: "as these tables already exist on desktop") and an older patient-additional-data resync (deletes local rows first) [MOB-14, N6].
- Sent as `tablesForFullResync` on every `pull/initiate` until cleared; central adds a second snapshot of those models since tick -1 (`CentralSyncManager.js`; code comment: "used when mobile needs to wipe and resync tables as part of the upgrade process") [MOB-14].
- Cleared inside the save transaction by `postPull`, so a failed save keeps it [MOB-14, N6].
- Different from central's lookup rebuild (`lookupModelsToRebuild`, `lookupPatientsToRebuild` in central's database, recompute lookup rows for all) [MOB-15].
- Different from "each server migrates its own data": mobile migrations are per-device raw SQL and transform locally without sync, but a migration adding a table that already holds server data cannot be deterministic, so it requests a resync. Mobile uses both patterns [MOB-17].
- Unresolved: a fresh install running the procedure migration may queue the table twice on the initial path (plain inserts) with no de-duplication found [Unresolved].

## 8. Scheduling and lifecycle

- Interval: `BackendManager.startSyncService` runs one sync now, then every 5 minutes, hard-coded `SYNC_PERIOD_MINUTES`, not a setting; waits for a facility to be chosen [N7].
- Urgent: `triggerUrgentSync` runs an urgent `triggerSync` now and repeats every `sync.urgentIntervalInSeconds` (default 10, read from pulled `Setting` rows); cleared when a started sync ends; while central keeps it queued it keeps retrying. Callers: the Manual sync button on `SyncDataScreen` (hidden while syncing), marking a patient for sync [N7].
- Backgrounding: nothing runs in the background (no background task or foreground service; out of scope in #11596). If killed mid-sync: staging cleaned next start; cursors only move at end of push and inside the save transaction, so the next sync repeats; central session stays open until its timeout, as only thrown errors are reported. Initial sync rolls back unless the unsafe pragma was on [N7].
- Lost connection: each request through `callWithBackoff`, up to 15 attempts, Fibonacci delays of 300 ms steps capped at 10 s (about 76 s), only for recoverable errors; bare network failure counts as recoverable (`inference`). Still failing fails the sync; no mid-session resume on main (#11565, #11531 open) [N7].
- Keep-awake (SYNAWK, #11596): `activateKeepAwake` after session granted, released in `finally` on success or failure; queued syncs hold nothing; every trigger path holds it, whatever screen is showing. Holds the screen on only, not the process [MOB-28, `specs/sync/mobile-keep-awake.md`].
- Database maintenance: `PRAGMA optimize`, `VACUUM` once on old databases, incremental vacuum, run on backgrounding when no sync is running. `runSync` waits for it [MOB-26].

## 9. Progress reporting

- Stages: incremental `{1:33, 2:66, 3:100}`, initial `{1:33, 2:100}` [MOB-22].
- Stage 1 (push) reports real progress 0 to 33 when there is something to push. The jump: at the start of the pull stage progress is set to 33 with "Pausing at 33% while server prepares for pull, please wait…" while `initiatePull` polls central's snapshot build. Reason (code comment): "we don't really know how long it will take" [MOB-22].
- Initial: 33 then 33 to 100 over "Saving changes". Incremental: download 33 to 66, save 66 to 100 [MOB-22].
- `updateProgress(total, done, message)` maps `done/total` onto the stage slice, `ceil`ed and capped [N8].
- Pattern: state on the instance (`syncStage`, `progress`, `progressMessage`, and others); `setSyncStage` and `setProgress` emit `SYNC_STATE_CHANGED` with no payload; subscribers re-read the instance (`SyncDataScreen.tsx`). Exceptions: `SYNC_ERROR` carries `{ error }`, `SYNC_ENDED` a time string; `SYNC_ERROR` and `SYNC_RECORD_ERROR` share the value `'syncRecordError'`. `BackendContext` invalidates all queries on `SYNC_ENDED`. Stage table dates from 2022-11-22 (#2644), the pausing message from 2023-02-27 (#3601) [MOB-23, MOB-24].

## 10. What mobile does not do or hold

- No `logs.changes`, no changelog attach, no triggers [MOB-07, MOB-21]. Central never attaches changelog for mobile pulls (code comment: "changelog data is not stored on mobile") [MOB-07].
- No push-then-delete direction [N9].
- Tables with no mobile model include `Role`, `Permission`, `Template`, `Asset`, `CertifiableVaccine`, `LocationAssignment*`, `TaskTemplate*`, `UserDesignation`, `UserLeave`, `UserPreference`, `ReportDefinition*`, `PortalUser`, `ReferenceDrugFacility`, `ReferenceMedicationTemplate`, imaging external-code tables (a guide; names differ between server and mobile in places) [MOB-06].
- Direction differences: mobile pushes only `Note`, `VitalLog`, `Attachment`; pull-only for `ReferenceData`, `ReferenceDataRelation`, `ReferenceDrug`; three server pull-only models are bidirectional on mobile but never edited, so never pushed [N9, MOB-06].
- Sync all lab requests: off for mobile. Central sets the flag with `... && !isMobile && since > -1` (code comment: no need for historical ones on initial sync, and none on mobile) [MOB-11]. Sync all vaccines: no trace in code, settings, specs or docs [MOB-12].
- Sensitive data: device sends its single facility id; central resolves that facility's sensitive network and restricts the snapshot. Mobile holds `SensitiveNetwork` and `Facility` rows (pull-only) and records only membership (`specs/sync/sensitive-networks.md`) [N9].
- Permissions: reach mobile via the login response, not sync. `create SyncPatient` is enforced in the client only (`specs/sync/marking-patients-for-sync.md`) [MOB-06, N9].
- Field-level conflict resolution: only `PatientAdditionalData` has `updatedAtByField`, set by its own listener (extra `findOne` per save); incoming raw writes keep the value central sent; no sub-field merge for JSON, stored as strings [MOB-01, MOB-02, MOB-05].
- Each device is its own sync node (own id and cursors) but the patient set is per facility [MOB-03].

## 11. Settings and config

Declared under `mobileSync` in `packages/settings/src/schema/central.ts`; mobile reads them from the login response, merged with facility settings on facility selection, falling back to code defaults [N5, Other].

| Setting | Default | Effect |
| --- | --- | --- |
| `mobileSync.useUnsafeSchemaForInitialSync` | false | Unsafe pragma during initial sync (`highRisk`) |
| `mobileSync.maxBatchesToKeepInMemory` | 5 | Snapshot rows (5000 records) held in memory |
| `mobileSync.maxRecordsPerInsertBatch` | 2000 | Rows per insert statement, clamped to 32,766 variables |
| `mobileSync.maxRecordsPerUpdateBatch` | 2000 | Rows per update batch |
| `mobileSync.maxRecordsPerSnapshotBatch` | 1000 | Records per staging row |
| `mobileSync.dynamicLimiter.initialLimit` | 10000 | First page size |
| `mobileSync.dynamicLimiter.minLimit` | 1000 | Page size floor |
| `mobileSync.dynamicLimiter.maxLimit` | 40000 | Page size ceiling (heap limit) |
| `mobileSync.dynamicLimiter.maxLimitChangePerPage` | 0.3 | Max change between pages |
| `mobileSync.dynamicLimiter.optimalTimePerPage` | 10000 (ms) | Target time per page |
| `sync.urgentIntervalInSeconds` (facility schema) | 10 | Urgent retry interval; read from pulled `Setting` rows [N7] |

Hard-coded, not settings: 5-minute schedule, 1 KiB compression threshold, 15 retry attempts [N7, N4].

## 12. Reporting errors to central and the device id

- #10567: `markSessionErrored` posts `sync/:id/error`; central ends the session with the error. Wraps push, pull and end in one try, then rethrows; the report is best-effort. Before it, central kept the session open until its own timeout. A kill, or a failure before a session exists, is not reported [N10, N11].
- Device id: `mobile-<uuid v4>` minted once and kept in app config (#6677; earlier `mobile-<device-info unique id>`). Sent on session start, pull initiate, push complete, refresh, login. Lives in app storage, not SQLite: restoring the database keeps it, clearing app storage mints a new one [N11].
