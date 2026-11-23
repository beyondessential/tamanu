# Mobile client (React Native, TypeORM, SQLite) as a sync client

Code checked at main, commit `22d3edaa36`. Paths are relative to the repository root. `MSM` below means `packages/mobile/App/services/sync/MobileSyncManager.ts`, `FSM` means `packages/facility-server/app/sync/FacilitySyncManager.js`, `CSC` means `packages/mobile/App/services/sync/CentralServerConnection.ts`, `CSM` means `packages/central-server/app/sync/CentralSyncManager.js`.

Caveat on method: `node_modules` is not installed in this worktree, so TypeORM's own source could not be read. Every statement about what TypeORM does with entity listeners on non-`save()` paths is marked `inference`. Statements about our own code are from reading it. No tests were run.

## Drift

- MOB-04 "mobile isn't made to sync that volume" is true in spirit but there is no stated limit; the evidence is memory-driven page caps and a setting warning against unsafe pragmas above about 3 million records.
- MOB-06 "every sync node syncs all reference data" is only partly true for mobile: mobile holds a subset of the tables facility servers treat as configuration.
- MOB-11 "sync all lab requests" does not apply to mobile at all; central switches it off for mobile sessions.
- MOB-16 (central half, not checked here) and MOB-17: mobile migrations do not follow "deterministic, no sync needed" for new synced tables. They ask central to resend.
- MOB-18, MOB-27, MOB-30 "mobile works the same as facility now" is a fair skeleton but the differences in the table in N1 matter more than the similarities (no pending-edit lock, no changelog, different initial path, different staging).
- MOB-19 "temporary tables": the staging area is a real table in an attached throwaway SQLite file, not a SQL `TEMP` table, and it is only used for incremental sync.
- MOB-20 the 999-parameter explanation for files cannot be confirmed from code or PR bodies; the two changes landed together.
- MOB-22 the jump to 33% happens at the start of the pull stage, not at stage one; stage one reports real push progress when there is something to push.
- MOB-23 the progress pattern is closer to four years old than three.
- MOB-26 database maintenance is not unrelated to sync: `runSync` now waits for a running VACUUM.
- MOB-32 the unsafe pragma is not removed. It is still in the code behind `mobileSync.useUnsafeSchemaForInitialSync` (default `false`).
- MOB-34 no code blocks the user during initial sync that I could find; what protects against partial state is the single save transaction.

## Claims

### MOB-01 Only patient additional data opted into field-level conflict resolution
Source: Part 1 00:16:01
Verdict: confirmed
Evidence: `updatedAtByField` exists on exactly one syncing model on the server side (`packages/database/src/models/PatientAdditionalData.ts:31,91`; the only other hits in `packages/database/src` are the lookup table, the merge function and the lookup select). Mobile has the same single opt-in: `packages/mobile/App/models/PatientAdditionalData.ts:182-184` declares the column, and no other mobile model has it. The merge itself is `packages/database/src/sync/mergeRecord.ts:17-52`: per-field `pickLatest` when both sides carry `updatedAtByField`, otherwise "incoming wins".
Why: proof of concept, per the transcript; no code comment says so. `inference` for the history.
Notes: `Setting.ts:65` on mobile has a stale comment mentioning `updatedAtByField` but it handles `value`, not field ticks.

### MOB-02 Field-level resolution records the tick of each field's last edit, at a cost
Source: Part 1 00:16:01
Verdict: confirmed
Evidence: mobile does the per-field recording itself, in a TypeORM listener: `packages/mobile/App/models/PatientAdditionalData.ts:188-232` (`setUpdatedAtByField`, `@BeforeInsert @BeforeUpdate`). It reads the current tick (`CURRENT_SYNC_TIME` local fact), loads the old row with an extra `findOne` (line 192-196), and writes snake_case field names mapped to the tick into a JSON string. SQLite has no JSON type, so push parses it (`:268-281`) and pull stringifies it (`:283-298`).
Why: the cost the transcript describes (extra read per save, extra data per record) is visible in the hook. Lines 199-200 say the hook does not recalculate when a record "syncing down to this device" already carries a value.
Notes: because the hook only fires on entity saves, incoming PAD rows written by raw SQL keep the `updatedAtByField` that central sent (see MOB-14 notes in N2).

### MOB-03 On mobile each device is its own sync node
Source: Part 1 00:17:01
Verdict: confirmed, with a nuance the transcript does not give
Evidence: each device mints and persists its own id (`CSC:91-99`, `mobile-<uuid>`, stored in app config) and sends it with `isMobile: true` and `facilityIds: [facilityId]` on session start (`CSC:223-235`) and on `pull/initiate` (`CSC:276-284`). Central keeps a session and a pull cursor per device. The patient set is not per device: it comes from `PatientFacility` rows for the device's single facility (`CSM:493-497`, snapshot of newly marked patients at `CSM:579-593`; `specs/sync/marking-patients-for-sync.md` "Marking a patient for sync on mobile": every device at the facility pulls the patient).
Why: central cannot tell two devices at one facility apart for patient selection; they differ only in cursor.
Notes: so a roaming-ward setup means each device holds every patient marked for sync at that facility.

### MOB-04 Mobile is not built to hold a busy hospital's data
Source: Part 1 00:17:01
Verdict: partly
Evidence: no code limit. Memory is the visible constraint: `packages/mobile/App/services/sync/utils/calculatePageLimit.ts:13-14` caps a page at 40,000 records because more "can hit heap limit errors for devices with allocated memory <= 192 MB"; `packages/settings/src/schema/central.ts:261-266` says the unsafe initial-sync schema "should be turned off if large initial syncs over 3 million records"; `saveIncomingChanges.ts:82-84` forces garbage collection because "the memory will be exhausted during this step in larger syncs"; the whole outgoing snapshot is held in memory (`snapshotOutgoingChanges.ts:38-53`).
Why: code comments above.
Notes: this is a statement about practice, not an enforced cap.

### MOB-05 No sub-field conflict resolution for JSON fields
Source: Part 1 00:18:02
Verdict: confirmed
Evidence: `mergeRecord.ts:25-33` merges per top-level key; a JSON value is one key and is chosen whole by `pickLatest`. On mobile such values are stored as strings in SQLite (`PatientAdditionalData.ts:283-298`, `models/Setting.ts:65-70`), so there is nothing finer to merge.

### MOB-06 Every sync node syncs all reference data
Source: Part 1 00:18:02
Verdict: partly
Evidence: mobile pulls `ReferenceData`, `ReferenceDataRelation`, `ReferenceDrug`, `Facility`, `Department`, `Location`, `LocationGroup`, `User`, `Setting`, program and survey tables and others, all `PULL_FROM_CENTRAL` (`packages/mobile/App/models/*.ts`, `static syncDirection`). Central filters the snapshot to the tables the device names in `tablesToInclude` (`CSM:489-491`, `getTableNamesForDirection` at `MSM:394`). Facility models with no mobile model at all, found by comparing `packages/database/src/models` to `packages/mobile/App/models/modelsMap.ts`, include: `Role`, `Permission`, `Template`, `Asset`, `CertifiableVaccine`, `LocationAssignmentTemplate`, `LocationAssignment`, `ImagingAreaExternalCode`, `ImagingTypeExternalCode`, `LabTestPanelLabTestTypes`, `ProcedureTypeSurvey`, `ReferenceDrugFacility`, `ReferenceMedicationTemplate`, `TaskTemplate`, `TaskTemplateDesignation`, `UserDesignation`, `UserLeave`, `UserPreference`, `ReportDefinition`, `ReportDefinitionVersion`, `PortalUser`. (Derived by file and model name; a handful of mobile names differ from the server file names, for example `Diagnosis` against `EncounterDiagnosis`, so treat the list as a guide.)
Why: the mobile app does not use those features. Permissions reach mobile through the login response (`CSC:377-407`, `AuthService`), not sync.
Notes: some pull-only server tables are `BIDIRECTIONAL` on mobile (`PatientFieldDefinition`, `PatientFieldDefinitionCategory`, `ProgramRegistryClinicalStatus`); harmless while nothing edits them, because pulled rows keep the sentinel tick (N2).

### MOB-07 Mobile does not write `logs.changes`; central's triggers write them when a mobile push is persisted
Source: Part 1 01:42:18
Verdict: confirmed
Evidence: `CSM:737-757`: `persistIncomingChanges` calls `pauseAudit` only `if (!isMobile)`, with the comment "currently we do not create audit logs on mobile devices so we rely on sync process to create audit logs". The other half, in the facility path, is `attachChangelogToSnapshotRecords` on push (`FSM:312-321`), which mobile never calls; and on pull central skips attaching changelogs for mobile (`CSM:722-731`, comment "changelog data is not stored on mobile"). Mobile has no `CREATE TRIGGER` anywhere (`grep -ri "create trigger" packages/mobile/App` finds nothing).
Why: code comments above.

### MOB-08 So central only has the latest change per record since the last sync as audit trail
Source: Part 1 01:42:18
Verdict: confirmed
Evidence: a push carries one row per changed record (`snapshotOutgoingChanges.ts:39-53`, `updatedAtSyncTick > since`), so intermediate edits between syncs are collapsed before central ever sees them; central's trigger then records one change per persisted row.

### MOB-09 The user on those mobile-originated `logs.changes` is probably whoever is doing the sync
Source: Part 1 01:42:18
Verdict: confirmed
Evidence: the audit user is read from async-local storage set per request from `req.user` (`packages/database/src/utils/audit/attachAuditUserToDbSession.ts:9-15`, wired at `packages/central-server/app/createApi.js:55`, applied to each query at `packages/database/src/services/database.js:154-190`). The persist is started by the `POST /:sessionId/push/complete` handler and not awaited (`packages/central-server/app/sync/buildSyncRoutes.js:358-366`, `CSM:882-895`), so it inherits that request's user. For mobile that is the clinician signed in on the device at sync time, which may not be the person who made the edit.
Why: Node async-local storage propagates into un-awaited promises started inside the request. `inference` for that propagation; the wiring is read.

### MOB-10 The tick-tock on persisting a push is purely for a unique save tick now
Source: Part 1 01:43:31
Verdict: confirmed
Evidence: `CSM:752-756` carries the quoted comment, and `tickTockGlobalClock` is at `CSM:127-132` (`incrementValue(..., 2)`, returns `tick = tock - 1`). It runs for mobile pushes as for facility pushes; there is no mobile branch.

### MOB-11 Sync all lab requests: take every lab request and what it depends on, for facilities that have a lab
Source: Part 2 00:27:37 (and 00:25:56)
Verdict: partly
Evidence: central reads the setting `sync.syncAllLabRequests` across facilities (`CSM:519-531`) but sets the session flag with `syncAllLabRequests && !session.parameters.isMobile && since > -1` (`CSM:562`), with the comment "no need for historical ones on initial sync, and no need on mobile". So mobile never gets the all-lab-requests behaviour, and no session gets it on its initial sync.
Why: code comment at `CSM:560-561`.
Notes: the transcript's description fits facilities only.

### MOB-12 The old "sync all vaccines with these IDs" behaviour was dropped
Source: Part 2 00:27:37 to 00:29:57
Verdict: confirmed (absence); reason unverifiable
Evidence: searched `packages`, `specs` and `docs` for `syncAllVaccin`, `sync_all_vaccin`, `ForTheseVaccines`: no hit in code, config, settings schema, specs or docs. Git history shows only unrelated vaccine commits. Mobile's current way to hold a patient's vaccination record offline is the ordinary route: mark the patient for sync at the device's facility (`ui/components/PatientSyncStatus/index.tsx:38-44`, `models/Patient.ts:82-91`).
Why: reason (hard to redo in the new sync, over-synced on mobile) is only in the transcript. `inference` not possible from code.

### MOB-13 The only special sync flag now is sync all lab requests, carried as `is_lab_request` on the lookup table
Source: Part 2 00:29:57
Verdict: confirmed (central side, outside this area)
Evidence: `packages/central-server/app/sync/snapshotOutgoingChanges.js:286-291` adds `OR is_lab_request IS TRUE` only when the session flag is set. Left for the central ledger to verify the lookup column.

### MOB-14 When a migration is too hard on mobile, mobile asks central for the whole table from scratch
Source: Part 2 01:19:05
Verdict: confirmed
Evidence: a migration calls `triggerFullResync(queryRunner, tables)` (`packages/mobile/App/migrations/utils/triggerFullResync.ts:3-20`), which inserts a `local_system_facts` row with key `tablesForFullResync` and a comma-joined table list. The only callers are `1759957009000-addAndSyncProcedureTables.ts:204` and, in older form, `1669855692000-resyncPatientAdditionalData.ts` (which deletes the rows locally first, then inserts the fact). Next sync reads it (`MSM:389-392`), sends it as `tablesForFullResync` on `pull/initiate` (`CSC:270-284`), and central adds a second snapshot of those models since tick -1 (`CSM:613-628`, `buildSyncRoutes.js:224-233`). The fact is deleted inside the pull save transaction (`MSM:550-551`).
Why: code comment at `CSM:613-614`: "used when mobile needs to wipe and resync tables as part of the upgrade process". The procedure migration says why (line 203): "as these tables already exist on desktop".

### MOB-15 That is a resync, not central's lookup-table rebuild
Source: Part 2 01:19:05
Verdict: confirmed
Evidence: the mobile list lives in the device's SQLite `local_system_facts` (key `tablesForFullResync`) and drives a pull parameter. Central's rebuild state is separate facts in central's database: `lookupModelsToRebuild`, `lookupPatientsToRebuild` (`packages/constants/src/facts.ts:16-17`), consumed in `updateLookupTable.js:394-411`. Different store, different consumer, different effect (re-send to one device versus recompute the lookup rows for all).

### MOB-16 Lookup table can drift when the database is changed without bumping the sync tick; migrations turn the tick trigger off
Source: Part 2 01:19:05 to 01:20:37
Verdict: partly verified (only the trigger switch; the lookup drift is for the central ledger)
Evidence: the `syncTrigger` fact (`packages/constants/src/facts.ts:15`) is set back to `enabled` after migrations at `packages/database/src/services/migrations/hooks/postMigrationHooks.ts:281`. The mobile analogue holds too: no mobile migration stamps `updatedAtSyncTick` (grep for `SET updatedAtSyncTick` finds nothing), so migrated rows keep -999 and are never pushed.

### MOB-17 Deterministic migrations mean each server ends up with its own correct data without sync
Source: Part 2 01:20:37
Verdict: partly (for mobile)
Evidence: mobile migrations are per-device raw SQL (no triggers, see MOB-07), so a transform applies locally. But a migration that creates a table that already has data on the server cannot be deterministic: it queues a full resync instead (MOB-14). Mobile therefore uses both patterns.

### MOB-18 The facility and mobile sync managers are pretty similar
Source: Part 2 01:46:37
Verdict: partly
Evidence: same skeleton (session, push, pull, end), same cursor facts, same page limiter shape (`facility-server/app/sync/calculatePageLimit.js:1` says "File is mirrored on mobile"). Real differences are in the table in N1.

### MOB-19 Mobile no longer writes staged records to files; it creates temporary tables
Source: Part 2 01:47:30
Verdict: partly
Evidence: files are gone: `getFilePath.ts` (batch JSON files under `syncSessions/<session>/<table>/`) was last used by the pre-#7983 code and deleted as dead code in #10852 (`git show 6b77e94103^:.../getFilePath.ts`). Staging is now `snapshot.sync_snapshot`, a real table in an attached database file (`packages/mobile/App/infra/db/snapshotDatabase.ts:8-10`, `index.ts:189-204`, `manageSnapshotTable.ts:34-46`), created per incremental sync and dropped afterwards. Rows hold JSON arrays of records (`insertSnapshotRecords`, `manageSnapshotTable.ts:6-15`; `maxRecordsPerSnapshotBatch` default 1000 records per row, `central.ts:289-293`). Initial sync stages nothing (MOB-33).
Why: #11176 (staging moved out of the main file) and #7983 (files to table). See N10.
Notes: not an SQL `TEMP` table; it lives in a file that is deleted and recreated, not in the main database.

### MOB-20 Files were used because older SQLite had a 999 substitution-parameter limit
Source: Part 2 01:47:30
Verdict: unverifiable (plausible)
Evidence: the limit is now 32,766 (`packages/mobile/App/infra/db/limits.ts:1-2`) and batch size is clamped to it (`getEffectiveBatchSize`, `limits.ts:10-16`). The commit that lifted the 999 limit (#7929, "KOR-32: Remove 999 restriction on SQLITE_MAX_VARIABLE_NUMBER") was squashed into #7983, the same commit that removed the file staging. Neither commit message states a causal link.
Why: `inference` only.

### MOB-21 Other sync-related database triggers (beyond created-at and updated-at)
Source: Part 2 01:48:27
Verdict: wrong for mobile; there are none
Evidence: mobile has no triggers at all (MOB-07). The equivalent work is a TypeORM listener, covered in N2.

### MOB-22 Stage one is 33% and the bar just jumps there, because that progress happens on central
Source: Part 3 01:18:30
Verdict: partly
Evidence: stages are `{1:33, 2:66, 3:100}` incremental and `{1:33, 2:100}` initial (`MSM:36-44`). Stage 1 is the push and does report real progress, 0 to 33, whenever there is anything to push (`MSM:345-355`, `updateProgress` at `MSM:129-143`). The jump is at the start of stage 2: `MSM:384-387` sets progress to `progressMaxByStage[1]` (33) with the message "Pausing at 33% while server prepares for pull, please wait…" before `initiatePull`, which polls central until its snapshot is built (`CSC:286-295`). So the stretch with no progress is the central snapshot, and the 33% is where the bar waits.
Why: comment at `MSM:381-383`: "we don't really know how long it will take".
Notes: on initial sync stage 2 runs to 100 and is the save, so the bar goes 33, then 33 to 100 over "Saving changes". On incremental sync stage 2 is the download (33 to 66) and stage 3 the save (66 to 100).

### MOB-23 That progress design was done about three years ago
Source: Part 3 01:19:49
Verdict: partly
Evidence: the stage table arrived with the new sync model on 2022-11-22 (`450e768eb3`, #2644); the "Pausing at 33%" message on 2023-02-27 (`032e21ae2b`, #3601). Closer to four years than three.

### MOB-24 Progress is stored on the instance; only a state-change event is emitted and the subscriber reads the instance
Source: Part 3 01:20:48
Verdict: confirmed, with exceptions
Evidence: `setSyncStage` and `setProgress` set `syncStage`, `progress`, `progressMessage` then `emit(SYNC_STATE_CHANGED)` with no argument (`MSM:107-121`). The subscriber re-reads the instance: `ui/navigation/screens/home/Tabs/SyncDataScreen.tsx:68-77`. Not every event is payload-free: `SYNC_ERROR` carries `{ error }` (`MSM:205`) and `SYNC_ENDED` carries a string `time=...ms` (`MSM:212`). `SYNC_ERROR` and `SYNC_RECORD_ERROR` are the same string value `'syncRecordError'` (`types.ts:54-55`).
Notes: a second no-payload consumer is `ui/contexts/BackendContext.tsx:32-38`: on `SYNC_ENDED` it calls `queryClient.invalidateQueries()`, i.e. "something changed, re-query" for the whole app.

### MOB-25 The pattern came from live-updating desktop pages, where the data is too big to publish
Source: Part 3 01:21:52
Verdict: unverifiable here
Evidence: the mobile code gives no sign of that history. The `BackendContext` consumer in MOB-24 does match the "re-run your queries" use.

### MOB-26 "Database maintenance in progress" has nothing to do with sync; it is vacuuming and analysing when the app closes
Source: Part 3 01:23:07
Verdict: partly
Evidence: maintenance (`PRAGMA optimize`, then `VACUUM` once on old databases, then incremental vacuum) runs when the app goes to the background and no sync is running (`packages/mobile/App/services/BackendManager.ts:62-86`, `infra/db/index.ts:296-326, 348-439`). It does touch sync: `runSync` awaits `Database.maintenanceInProgress` before opening a session, "so the session isn't held open waiting on the write lock" (`MSM:230-235`), and `onAppStateChange` skips maintenance when a sync is running (`BackendManager.ts:73`).
Why: code comment at `MSM:230-231`; #11189 (the sister to #11176).

### MOB-27 Mobile basically works the same way as facility now
Source: Part 3 01:23:07
Verdict: partly
Evidence: see N1.

### MOB-28 A keep-awake was added to mobile sync two weeks before the session
Source: Part 3 01:23:07
Verdict: confirmed
Evidence: #11596 merged 2026-11-04 (commit `a7de96b91f`); `MSM:270-273` activates after a session is granted, `MSM:296-298` deactivates in a `finally`. Spec `specs/sync/mobile-keep-awake.md` (SYNAWK). Tests: `MobileSyncManager.test.ts:188-261` (held from session grant to end, released on failure, not held when queued, held for syncs started by `triggerSync`).
Why: PR body says native wake lock or foreground service is out of scope, tracked on another card.
Notes: keep-awake holds the screen on; it does not keep the process alive in the background (see N7).

### MOB-29 Incoming changes are staged in a table in a different schema now
Source: Part 3 01:23:57
Verdict: confirmed (incremental sync only)
Evidence: schema `snapshot`, table `snapshot.sync_snapshot`, from an attached database file named `tamanu-sync-snapshot` (`snapshotDatabase.ts:8-10`), attached on connect (`infra/db/index.ts:172-179`), reset by `resetSnapshotDatabase` (`:189-204`) and by `dropSnapshotTable` (`manageSnapshotTable.ts:56-69`).
Why: `snapshotDatabase.ts:1-7` and #11176: keep per-page staging writes out of the main file's journal; "if sync fails, we just drop the snapshot and re-pull next time anyway". PR measured about 16 s faster for 1M records on an emulator.

### MOB-30 Same way facility and central do
Source: Part 3 01:24:19
Verdict: partly
Evidence: same idea, different shape. Facility and central stage into a Postgres table per session, `sync_snapshots."<sessionId>"`, one row per record with `direction`, `record_type`, `record_id`, `is_deleted`, `data`, `saved_at_sync_tick`, `requires_repull` and indexes (`packages/database/src/sync/manageSnapshotTable.ts:25-52`). Mobile has one fixed-name table with `id` and a `data` JSON text holding up to 1000 records per row, no direction, no indexes (`manageSnapshotTable.ts:34-46`), incoming only.

### MOB-31 Initial sync applies an unsafe pragma so SQLite does less checking on the way in
Source: Part 3 01:24:19
Verdict: confirmed (still present)
Evidence: `Database.setUnsafePragma` (`infra/db/index.ts:441-459`): `journal_mode = OFF`, `synchronous = 0`, big cache, `locking_mode = EXCLUSIVE`, `temp_store = MEMORY`. It is called at `MSM:435-438` and undone in the `finally` at `MSM:467-471`.
Notes: it disables rollback, so a crash mid-transaction cannot be undone while it is on (comment at `index.ts:441-442`).

### MOB-32 That unsafe pragma is no longer used because it hit constraint violations
Source: Part 3 01:24:19
Verdict: outdated / partly
Evidence: it is gated by `mobileSync.useUnsafeSchemaForInitialSync`, default `false` (`packages/settings/src/schema/central.ts:261-267`, flagged `highRisk` on the group at `:258`). Code still honours it (`MSM:435`), and two test files set it `true` (`MobileSyncManager.pull.test.ts:94`, `saveIncomingChanges.test.ts:31`). The "constraint violations" reason is not in code or in the PR bodies I could read. What did change for foreign keys is `PRAGMA defer_foreign_keys` for the whole save transaction (N5).
Why: `inference` only for the reason.

### MOB-33 Initial sync saves directly in one transaction instead of staging
Source: Part 3 01:24:19
Verdict: confirmed
Evidence: `MSM:423-472`: `runSyncSaveTransaction` wraps `pullRecordsInBatches(... saveChangesFromMemory ...)` and `postPull` in one transaction; each page is inserted as it arrives (`MSM:457-461`). Incremental sync is the two-phase version (`MSM:474-541`). Doc comment `MSM:366-372` states both paths.
Notes: the cursor (`lastSuccessfulSyncPull`) is saved in the same transaction (`MSM:543-570`), so a failed initial sync leaves no cursor and no rows (unless the unsafe pragma was on).

### MOB-34 That is fine because the user is blocked from the app, so a partial pull state does not matter
Source: Part 3 01:24:19
Verdict: partly
Evidence: I found no code that blocks the app during initial sync: `isInitialSync` is not read outside `MobileSyncManager` (grep across `packages/mobile/App`). Facility selection awaits the first sync (`ui/navigation/screens/signup/SelectFacilityScreen.tsx:133-138`) but assigns the facility first (line 137). What makes a partial state invisible is that nothing commits until the single transaction does.
Why: `inference`; see Unresolved.

## Open questions answered

- Which user is on `logs.changes` for mobile pushes (Part 1 01:42:18): the user whose request called `push/complete`, normally the signed-in clinician (MOB-09).
- "I don't think we write to files on mobile anymore?" (Part 2 01:47:30): correct, and the staging table has moved from the main database to an attached throwaway file since (MOB-19, MOB-29).
- "The only thing I'll look into is how we store all incoming changes in the snapshot table now" (Part 3 01:23:07): N5.
- "Did anything else do sanitisation?" (Part 3 01:25:30): on mobile, seven models define push or pull sanitisers: `Prescription`, `EncounterHistory`, `PatientAdditionalData`, `Setting`, `PatientFieldDefinition`, `AdministeredVaccine`, `PatientContact` (`grep sanitizeRecordDataForPush|sanitizePulledRecordData packages/mobile/App/models`). They are invoked at `snapshotOutgoingChanges.ts:46-49` and `saveIncomingChanges.ts:73-76`. These mostly convert JSON to or from strings and rename fields; they are format conversion rather than data-safety sanitisation.

## Not in the transcript

### N1 `MobileSyncManager` step by step, and against `FacilitySyncManager`

Mobile, in order (`MSM` lines):

1. Trigger. `triggerSync` (191-220): if already syncing, log and return (192-197), so a trigger during a sync is dropped, not queued. Runs `runSync`, emits `SYNC_SUCCESS` or `SYNC_ERROR` (202-206). Finally block resets state, emits `SYNC_STATE_CHANGED` and `SYNC_ENDED`, and clears the urgent interval, but only if a sync actually started (207-218).
2. Preflight (222-238). Throws if already syncing (223-225), sets `isSyncing` (228), waits for any running VACUUM (230-235), drops any leftover snapshot table from a previous session (237-238).
3. Choose the path (240-247). `pullSince` is the `lastSuccessfulSyncPull` fact, -1 if absent; `isInitialSync = pullSince === -1`; the stage table is picked from that.
4. Start session (249-265, `CSC:223-260`). `POST sync` with `urgent`, `lastSyncedTick`, `facilityIds: [facilityId]`, `deviceId`, `isMobile: true`; if no session id the sync is queued: `isSyncing` back to false, `isQueuing` true, `SYNC_IN_QUEUE` emitted, return (258-265). Otherwise poll `sync/:id/ready` and read `startedAtTick` from `sync/:id/metadata`.
5. Hold the screen awake (270-273) and emit `SYNC_STARTED` (276).
6. Push (280, 322-364). Stage 1. Read local `currentSyncTick` (326); overwrite it with the new session tick (331); read `lastSuccessfulSyncPush` (333); snapshot changed rows of every model whose direction is push or bidirectional (338-339); if any, page them to central then `completePush` (345-355, `pushOutgoingChanges.ts:15-45`); record the count (357); set `lastSuccessfulSyncPush` to the tick read at 326 (359).
7. Pull (281, 374-421). Stage 2. Show 33% and the pausing message (384-387); read the `tablesForFullResync` fact (389-392); `initiatePull` (396-401, `CSC:270-296`) returns `totalToPull` and `pullUntil`; branch to initial (410-411) or incremental (412-413).
   - 7a Initial (423-472): optional unsafe pragma, one transaction, save each page as it arrives, `postPull`, restore pragma.
   - 7b Incremental (474-541): zero records returns after only advancing the cursor (477-482); otherwise create the snapshot table (498), download pages into it (499-505), stage 3, then one save transaction that reads the snapshot in batches and runs `postPull` (517-540).
   - 7c `postPull` (543-570): assert a transaction is active; delete `tablesForFullResync`; upsert `lastSuccessfulSyncPull = pullUntil`, all inside the save transaction.
8. End (282): `DELETE sync/:id`.
9. Errors (283-289): any failure in 6, 7 or 8 is reported to central with `POST sync/:id/error` (`reportSyncError`, 306-316, best-effort, swallowed if it fails) and rethrown.
10. Cleanup (291-298). Drop the snapshot table, set `lastSuccessfulSyncTime`, reset progress, and always release keep-awake in `finally`. Note the snapshot table is not dropped on failure (it is dropped at the start of the next sync, step 2).

Facility server, `FSM` lines, against the same steps:

| Step | Mobile (`MSM`) | Facility (`FSM`) |
| --- | --- | --- |
| Concurrency | Second trigger during a sync is dropped (192-197) | Triggers coalesce: at most one queued next run, extra callers await it (88-126) |
| Run record | None. Last time and counts kept in memory (294, 357, 416) | A `SyncFacilityRun` row created first, completed with status, progress timestamps (138-175, 357, 373) |
| Disabled | No switch | `config.sync.enabled` (89) |
| Credentials, bootstrap | Interactive login supplies a token before sync; no bootstrap | Reads sync credentials (178-181), one-off `bootstrap` on first sync (193-195, 273-283) |
| `pullSince` | fact, -1 if absent (240) | fact `|| -1` (191) |
| Initial vs incremental | Separate code paths (410-413) | One path; initial differs only by bootstrap and size |
| Start session | Sends `isMobile: true`, single facility (`CSC:223-235`) | Sends all server facility ids (`packages/facility-server/app/sync/CentralServerConnection.js:138-148`) |
| Queued | Sets `isQueuing`, emits event, relies on next trigger (258-265) | Returns `{ queued: true }` (207-211) |
| Clear old staging | Before opening a session (238) | After session granted, all snapshot tables (217) |
| Tick at push start | Read old `currentSyncTick`, write new (326-331) | Same (287-292) |
| Wait for pending edits | None | `waitForPendingEditsUsingSyncTick` takes the advisory lock for the old tick (295) |
| Outgoing snapshot | SQLite transaction, `find()` per model (`snapshotOutgoingChanges.ts:37-54`) | `REPEATABLE READ` transaction, raw reads (`facility-server/.../snapshotOutgoingChanges.js:51-61`) |
| Changelog on push | None | `attachChangelogToSnapshotRecords` (312-321) |
| Push transport | Gzip when body is 1 KiB or more (`CSC:310-312`) | Uncompressed (`facility CentralServerConnection.js:235-238`; no compress/gzip in the facility sync files) |
| After push | Nothing | `deleteRedundantLocalCopies` for push-then-delete models (323) |
| Push cursor | `lastSuccessfulSyncPush` = old tick (359) | Same (326) |
| Pull transport | Poll pages, prefetch next page (`pullRecordsInBatches.ts:26-50`) | Streaming if central supports it, else polled pages (339-347) |
| Staging | Incremental only, attached SQLite file | Always, per-session Postgres table (338) |
| Staging marks | `updated_at_sync_tick: -1` on each record (`pullRecordsInBatches.ts:42`, effect discussed in N2) | `updatedAtSyncTick: -1` (`pullIncomingChanges.js:56`) which the trigger turns into -999 |
| Pre-save assertion | None | Optional `assertIfPulledRecordsUpdatedAfterPushSnapshot` (349-354) |
| Save transaction | One SQLite transaction, `defer_foreign_keys` (`runSyncSaveTransaction.ts:25-58`) | One Postgres transaction, `pauseAudit`, `withDeferredSyncSafeguards` (358-372) |
| Order of records | Any (deferred keys; sort removed in #11093) | Dependency-sorted in `saveIncomingChanges` |
| Cursor save | Inside save transaction (`postPull`) | Inside save transaction (371) |
| End and error | Report every failure to central (283-289) | Reports only local errors, not ones with a central response (229-234) |
| Staging cleanup | Success path and next start | `finally` every time (235-238) |
| Post-session work | None | `convergeSyncUser`, `pullSettingsPsk` (243-257) |
| Wake lock | `activateKeepAwake` (273) | n/a |
| Progress | Stages and percentages for a UI (N8) | Log lines and run record |

### N2 How mobile marks locally changed records with no triggers

The marker is `updatedAtSyncTick` on every table (`BaseModelWithoutId.ts:53-54`, `@Column({ nullable: false, default: -999 })`; every mobile table-creating migration declares the same default, checked by grep; the three migrations that mention the column without it only add indexes or move field ticks).

- Local writes. `assignUpdatedAtSyncTick` is a TypeORM `@BeforeInsert()` and `@BeforeUpdate()` listener on the shared base class (`BaseModelWithoutId.ts:69-84`). It reads the `currentSyncTick` fact with a query and assigns it to the entity. So a row's tick is the device's current tick at save time, and push picks up rows with `updatedAtSyncTick > lastSuccessfulSyncPush` (`snapshotOutgoingChanges.ts:40-44`). Soft deletes are updates through `updateValues(...)` which calls `instance.save()` (`models/BaseModel.ts:50-79`, used for `deletedAt` in `ui/contexts/ReminderContactContext.tsx:87`), so they go through the listener.
- Incoming records. They are written by hand-built SQL (`executePreparedInsert`, `executePreparedUpdate`, `saveIncomingChanges.ts:33,100-105`, `executePreparedQuery.ts:21-129`) which never loads an entity, so no listener runs. The column list comes from `extractIncludedColumns`, which removes `excludedSyncColumns` = `createdAt`, `updatedAt`, `updatedAtSyncTick` (`BaseModelWithoutId.ts:122`; `Attachment` adds `filePath`). So `updatedAtSyncTick` is never written for incoming rows: a new row takes the column default -999; an updated row keeps whatever tick it had. -999 is below every push cursor (cursor starts at -1), so `MoreThan(since)` never selects it.
- The `updated_at_sync_tick: -1` that `pullRecordsInBatches.ts:42` adds is, by my reading, dead on the current save path: it is snake_case, not a model property name, and the property is excluded anyway. It is a leftover of the earlier entity-based save (the listener's `-1` to `-999` rule at `BaseModelWithoutId.ts:72-78` is what it fed). `inference` for history; the filtering is read.
- Fallbacks. `repository.insert(row)` and `repository.update({ id }, row)` are used one row at a time when a batch fails (`executePreparedQuery.ts:42-55, 113-125`). Whether TypeORM runs entity listeners for plain objects passed to these is `inference` (documented TypeORM behaviour is that listeners need entity instances); either way `updatedAtSyncTick` is not in those rows.

Guarantees and leaks:

- There is no guarantee for writes outside entity `save()`. I found no such writes to synced tables in app code: the only non-`save` writers outside migrations and sync are `models.Attachment.delete(...)` (`ui/components/UploadPhoto/index.tsx:127`, a hard delete of a push-only row) and `LocalSystemFact.upsert` (not synced). Reads that use `createQueryBuilder` are selects. A future bulk `update()`, `softDelete`, `softRemove` or raw `query()` on a synced table would silently skip the tick (`inference` on TypeORM for the builder methods; raw SQL certainly skips it).
- Migrations are raw SQL, so migrated rows keep their old tick, normally -999 (MOB-16, MOB-17). A migration that needs central to learn about a change must set the tick itself or arrange a push another way.
- Incoming update over a locally edited row. The raw update does not touch the tick, so a row edited locally (tick above cursor) and then overwritten by a pulled version keeps the high tick and is pushed back with central's values. Central does not compare ticks on mobile pushes to resolve this (`MSM` pull save has no tick comparison, `saveIncomingChanges.ts:43-59`). A local edit made after the push snapshot and before the pull save to a row central also changed is lost (`inference` from the code path; no test pins it).
- Tick read before write race. The listener reads the tick, then the statement runs later. If the push step swaps `currentSyncTick` in between (`MSM:331`), a row can be written with the old tick after the snapshot was taken, and the cursor then moves to that old tick (`MSM:359`), excluding the row from every future push. The facility prevents this with an advisory lock the trigger also takes (`waitForPendingEditsUsingSyncTick`, `packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts:6-14`). Mobile has no equivalent. In practice the window is small because saves are short and one connection serialises statements, but nothing enforces it (`inference`).
- Before the very first sync the fact is absent and `getSyncTick` returns -1 (`getSyncTick.ts:12`), so any entity saved earlier (for example the local user row written at sign-in, `services/auth/AuthService.ts:44-61`) gets tick -1, which `MoreThan(-1)` never pushes. Only matters for push-capable models; `User` is pull-only.
- A UI reader depends on the same tick rule: `ui/navigation/screens/labRequests/tabs/ViewHistoryScreen.tsx:127` treats a record as synced when `updatedAtSyncTick <= lastSuccessfulPushTick`.

### N3 Mobile's sync tick

- Stored in the SQLite table `local_system_facts` (`models/LocalSystemFact.ts:6-17`, `DO_NOT_SYNC`) under three keys (`services/sync/constants.ts:9-11`): `currentSyncTick`, `lastSuccessfulSyncPush`, `lastSuccessfulSyncPull`. Missing means -1 (`getSyncTick.ts:12`). Written with `setSyncTick` (`setSyncTick.ts:3-17`). The key column has a unique constraint (`migrations/1787706001000-enforceUniqueLocalSystemFactKeys.ts`, after a dedupe migration `1787706000000`), which `triggerFullResync`'s plain `INSERT` would violate if the fact were still present when another migration inserted it (see Unresolved).
- Advanced once per session, at push start, to the tick central issued (`MSM:331`); not advanced by local writes. Local writes read it (N2).
- The push cursor moves to the previous tick after a push completes (`MSM:359`). The pull cursor moves to `pullUntil` inside the save transaction (`MSM:561-569`). If a sync fails after `MSM:331` the current tick stays at the failed session's value and the next successful push still uses the older push cursor, so nothing is skipped.
- "Wait for pending edits": nothing like it exists (N2).
- Last-pull display time is the `updatedAt` of the pull-cursor fact (`ui/components/PatientSyncStatus/index.tsx:30-37`).

### N4 Push on mobile

- Snapshot. `snapshotOutgoingChanges.ts:28-55`: inside `Database.client.transaction`, for each push or bidirectional model, `find({ where: { updatedAtSyncTick: MoreThan(since) }, withDeleted: true, loadEagerRelations: false })`, convert with `extractIncludedColumns`, optionally sanitise (`sanitizeRecordDataForPush`). The comment at line 32 says "Serializable is the default isolation level"; SQLite is serialisable, but app queries share the connection (`runSyncSaveTransaction.ts:17-21`), so I would not treat this as a point-in-time snapshot against concurrent app writes (`inference`; the facility uses `REPEATABLE READ`, `facility .../snapshotOutgoingChanges.js:47-61`).
- #11156 (`loadEagerRelations: false`) and #11181 (push into one array rather than `concat` each model): see N10.
- Excluded from the pushed data: `createdAt`, `updatedAt`, `updatedAtSyncTick` (and `filePath` for attachments). `deletedAt` is pushed and `isDeleted` flagged (`snapshotOutgoingChanges.ts:9-19`); central discards the pushed `deletedAt` for mobile and decides delete or restore itself (`packages/database/src/sync/saveIncomingChanges.ts:30-42`).
- Paging: dynamic limiter, `initialLimit` 10,000, min 1,000, max 40,000, 30% change per page, target 10 s (`calculatePageLimit.ts:10-17`, same defaults in central settings, `central.ts:297-324`). Settings come from the login response (`MSM:103-105`, `services/settings.ts:23-29`), not from the pulled `settings` table.
- Compression (#10795): `post(..., { compress: true })` only for the push (`CSC:310-312`). If the JSON body is 1024 bytes or more it is sent as a pre-serialised string with `Content-Encoding: gzip`, because React Native gzips string bodies natively and drops the header for other body types (`compressibleRequestBody.ts:1-15`, `CSC:177-203`). Central inflates it.
- Finish: `completePush` posts the list of pushed tables and polls `push/complete` once a second for up to 12 hours (`CSC:314-334`). Push models are push or bidirectional only; mobile has no push-then-delete, so pushed `Attachment` rows stay on the device (TODO at `models/Attachment.ts:35-38`; the comment in `ui/components/UploadPhoto/index.tsx:123-124` says they are deleted, which nothing does).

### N5 Pull on mobile

- Where records are staged. Incremental: `snapshot.sync_snapshot` in the attached file (MOB-29). Initial: nowhere; pages are saved straight into the main tables (MOB-33). Before #7983 (2025-10-07) the staging was JSON files per page and table under the app's documents directory (MOB-19); #7983 moved it to a table in the main database; #11176 (2026-10-13) moved it to its own journal-less file. The snapshot file runs `journal_mode = OFF`, `synchronous = OFF`, `auto_vacuum = FULL`, 16 KiB pages (`infra/db/index.ts:196-203`), and is recreated if unreadable (`manageSnapshotTable.ts:56-69`), because a kill mid-write can corrupt it.
- Download: `pullRecordsInBatches.ts:8-52`. Pages by cursor `{ sortOrder, id }` base64 (31), prefetches the next page while saving the current one (35-47), stops on an empty page or when `recordTotal` reached. Records with a table that has no pull model are silently dropped (`saveIncomingChanges.ts:69-72`).
- Initial vs incremental. Initial = `lastSuccessfulSyncPull` is -1. Differences: stages (33 then 100), optional unsafe pragma, no staging table, one transaction around download and save, inserts only (`executePreparedInsert`) except `User`, which goes through the insert-or-update path because the signed-in user's row already exists locally (`saveIncomingChanges.ts:97-98`, `AuthService.ts:44-61`; reason is `inference`). Incremental checks which ids already exist, then bulk inserts and updates (`saveChangesForModel`, 17-60). Zero-record incremental pulls skip all of it and only advance the cursor (#11092, `MSM:477-482`).
- Batch fallback (#10960). If a multi-row `INSERT` fails, rows are retried one by one, sequentially, so a bad row is named (`executePreparedQuery.ts:42-55`). The update fallback still uses `Promise.all` (`:113-125`); a review comment on #10960 flagged that as the same race, below the review's reporting threshold.
- Foreign keys. `PRAGMA defer_foreign_keys = ON` at the start of the save transaction (`deferForeignKeys.ts:13-15`, introduced in #9044 for self-referencing rows) so record order does not matter; the dependency sort was removed in #11093. SQLite fails the `COMMIT` if any violation remains. The diagnostic `PRAGMA foreign_key_check` runs only after a failed commit, while the rows are still present, to name offending records (#10308 introduced the naming, #11183 and #11095 moved it to the failure branch): `runSyncSaveTransaction.ts:25-58`, `checkForeignKeys.ts:29-65`. It is filtered to synced tables and resolves rowids to record ids one query per table. Postgres side uses `SET CONSTRAINTS ... DEFERRED` for foreign key and unique constraints (`withDeferredSyncSafeguards.ts:28-81`); mobile defers foreign keys only.
- Tombstones (#10350). Central sends `isDeleted`; mobile does not delete. `buildFromSyncRecord.ts:16` sets `deletedAt` to the current local datetime for deleted records and `null` otherwise, so an incoming non-deleted version of a locally soft-deleted row undeletes it. The value is device time, not central's deletion time.
- Cursor: `lastSuccessfulSyncPull` set to `pullUntil` inside the save transaction (`MSM:543-570`); a failed commit leaves no cursor and no rows.
- Sizes: `maxRecordsPerInsertBatch` and `maxRecordsPerUpdateBatch` default 2000; `maxBatchesToKeepInMemory` default 5 snapshot rows (5000 records); inserts are clamped to the SQLite parameter limit (`saveIncomingChanges.ts:20,115`, `executePreparedQuery.ts:34,97`).
- Updates group rows by column signature so a row that lacks a column does not write NULL into it (`executePreparedQuery.ts:73-84`).

### N6 Full resync of named tables

- Request: a migration calls `triggerFullResync(queryRunner, tables)` (MOB-14). Stored: local fact `tablesForFullResync`, comma-separated table names (not model names). Sent on every pull until cleared. Cleared: inside the save transaction by `postPull` (`MSM:550-551`), so a failed save keeps it for the next attempt.
- Central side: filters the models by table name and takes a second snapshot since -1 for them, in addition to the normal snapshot (`CSM:613-628`). It reaches central through `buildSyncRoutes.js:224-233` and is stored in the session parameters (`CSM:482-487`).
- Contrast with central's lookup rebuild: different store and trigger (MOB-15).
- Note: `triggerFullResync` writes to `local_system_facts`; the 2022 migration writes to `local_system_fact` (the earlier table name) and also deletes the table's rows locally first. The newer helper does not delete.

### N7 Schedule, urgent sync, backgrounding, failure

- Schedule: `BackendManager.startSyncService` runs one sync immediately and then every 5 minutes, from a hard-coded constant `SYNC_PERIOD_MINUTES = 5` (`BackendManager.ts:12,88-116`); not a setting. It does nothing until a facility is chosen (97-101). Facility server schedule for comparison is config `sync.schedule` default every minute (`packages/facility-server/config/default.json5:11`).
- Other triggers: sign in with a facility chosen (`ui/contexts/AuthContext.tsx:132`), reconnect with password (`:110`), facility selection (`SelectFacilityScreen.tsx:138`).
- Urgent sync: `triggerUrgentSync` (`MSM:167-185`) repeats an urgent `triggerSync` every `sync.urgentIntervalInSeconds` (default 10, read from the pulled `Setting` rows, schema `packages/settings/src/schema/facility.ts:283-289`) and runs one now. The interval is cleared when a sync that actually started ends (`MSM:213-216`); while central keeps the session queued it keeps retrying at that interval. Callers: the "Manual sync" button (`ui/navigation/screens/home/Tabs/SyncDataScreen.tsx:148-157`, hidden while syncing) and marking a patient for sync (`PatientSyncStatus/index.tsx:41`).
- Connection lost mid-sync: each request goes through `callWithBackoff` (`CSC:127-144`): up to 15 attempts, Fibonacci delays of 300 ms steps capped at 10 s (about 76 s in total), only for errors `isRecoverable` accepts (`packages/errors/src/extractErrorFromFetchResponse.ts:15-45`). A bare network failure becomes an `UNKNOWN` problem with no status (`CSC:57-60`), which that function treats as recoverable (`inference` on that classification). A request that still fails fails the whole sync; there is no mid-session resume on main. Open PR #11565 ("resume sync if device reconnects within a grace period", not merged) and #11531 (central tracks push progress, not merged) are the in-flight work. Both are open, not on main.
- Killed or backgrounded: nothing runs in the background (no background task or foreground service in the app; PR #11596 states that is out of scope). Keep-awake only holds the screen on. If the app is killed mid-sync: the staged table and any old session are cleaned at the next start (`MSM:237-238`); cursors only move at the end of push and inside the save transaction, so the next sync repeats from the old cursors; the central session stays open until central times it out, because only thrown errors reach `reportSyncError` (`MSM:283-289`). An interrupted initial sync rolls back, except with the unsafe pragma on, which has no rollback (MOB-31).
- Central waking from sleep: a `503` with `Retry-After` on session start is treated as queued (`CSC:36-45, 237-242`, spec `specs/sync/waking-central.md`, #11617).

### N8 Progress reporting

- State on the instance: `isInitialSync`, `isQueuing`, `isSyncing`, `progress`, `progressMessage`, `syncStage`, `progressMaxByStage`, `lastSuccessfulSyncTime`, `lastSyncPushedRecordsCount`, `lastSyncPulledRecordsCount` (`MSM:69-87`).
- Percentage: `updateProgress(total, done, message)` maps `done/total` onto the stage's slice, `ceil`ed and capped (`MSM:129-143`). Incremental slices: push 0-33, download 33-66, save 66-100. Initial: push 0-33, save 33-100.
- Messages: "Pushing all new changes…" (353), the pausing message (386), "Pulling changes (n / total)" (495), "Saving changes (n / total)" (431, 514), "Sync in progress…" or "Sync in queue" when queued (262).
- Events (`types.ts:48-56`): `syncInQueue`, `syncStarted`, `syncStateChanged`, `syncEnded`, `syncSuccess`, `syncRecordError`. The UI subscribes to everything with the `'*'` handler in `SyncDataScreen.tsx:86`.
- Why the first stage jumps: MOB-22.

### N9 What mobile does not do, and which patients a device holds

- No `logs.changes` and no changelog attach (MOB-07). No triggers (MOB-21).
- No `PUSH_TO_CENTRAL_THEN_DELETE`: the enum has no such value (`packages/mobile/App/models/types.ts:1-6`).
- Models skipped: `LocalSystemFact` is `DO_NOT_SYNC`; the list in MOB-06 has no mobile model.
- Direction differences from the facility models (found by comparing `static syncDirection`): mobile pushes only `Note`, `VitalLog` and `Attachment` (facility: bidirectional for the first two); mobile is pull-only for `ReferenceData`, `ReferenceDataRelation`, `ReferenceDrug` (facility models declare bidirectional); mobile marks three server pull-only models bidirectional (MOB-06).
- Which patients a device holds: those with a `PatientFacility` row for the device's one facility, plus all non-patient tables it names. A mobile device marks a patient for sync by creating that row locally (`Patient.markForSync`, `models/Patient.ts:82-91`, also called from `PatientAdditionalData.ts:237-240` on insert and from patient creation and editing, `specs/sync/marking-patients-for-sync.md`). The row syncs up, and on the next pull central sees the newly marked patient and sends the full history (`CSM:493-497, 579-593`). Permission to do it deliberately (`create SyncPatient`) is enforced in the app only (`PatientSyncStatus/index.tsx:76-78`; spec line "Mobile enforces the permission in the client only").
- Sync all lab requests: off for mobile (MOB-11). Sync all vaccines: no trace (MOB-12).
- Sensitive facilities: mobile sends the device's single facility id; central resolves that facility's sensitive network and restricts the snapshot (`CSM:537-559`; `specs/sync/sensitive-networks.md` "Mobile"). Mobile pulls `SensitiveNetwork` and `Facility` rows (`models/SensitiveNetwork.ts`, `models/Facility.ts`, pull-only) and records only membership.

### N10 PRs named in the brief: cause and lesson

Many bodies are template only; the cause is taken from code comments, the diff or the review thread, and marked where inferred.

- #11156 `loadEagerRelations: false` on the outgoing snapshot. Cause: `find()` loaded every eager relation (13 reference-data joins per patient additional data row; patient, village, billing type per encounter) only for `extractIncludedColumns` to throw the objects away. Lesson: relation ids are hydrated from the main row, so the pushed record is byte-identical; specs pin the contract (`snapshotOutgoingChanges.spec.ts`). Stack of three; the eager relations are gone from the models on main (no `eager: true` left in `packages/mobile/App/models`).
- #11181 avoid redundant shallow clones while snapshotting. Cause (from the diff): the snapshot rebuilt the whole array with `concat` for every model. Lesson: build once, push into one array. Body is template text.
- #10795 gzip push payloads. Cause: large push bodies over mobile networks (`inference`, from title). Lesson in code: let React Native do it by sending a string with the header; gzipped bytes would lose the header (`compressibleRequestBody.ts:3-10`); small bodies skip it. A review comment notes the facility could do the same; it does not yet.
- #11176 stage snapshot in a throwaway database. Cause: staged pages were journalled in the main database. Lesson: separate attached file with no journal and no fsync, because a failed sync just drops it and re-pulls; `auto_vacuum = FULL` so dropping shrinks the file; reset on corruption. Sister PR #11189 reclaims space in the main file.
- #10308 list foreign key problems in mobile sync. Cause (from `checkForeignKeys.ts:21-26`): with deferred keys a genuine violation failed only at commit as an anonymous "FOREIGN KEY constraint failed". Lesson: map violations back to record ids. Body is template text.
- #11183 (with #11092 to #11095, TAM-7126) run the diagnostic only when commit fails. Cause: the check scanned every table on every sync inside the write-locking transaction, every five minutes. Lesson: SQLite already fails a deferred `COMMIT` on any violation and leaves the transaction open with rows present, so run the diagnostic only then; TypeORM's `transaction()` rolls back before the callback sees the commit error, hence `runSyncSaveTransaction` drives the query runner directly. Also: zero-record pulls skip the transaction (#11092); the non-functional topological sort cost about 53 round trips per sync and is removed (#11093).
- #10960 batch insert fallback race. Cause: `Promise.all` over per-row inserts after a failed batch; `Promise.all` does not cancel the rest when one throws, and concurrent queries share one SQLite connection, racing the transaction's `ROLLBACK`. Lesson: sequential fallback. The update fallback still has the same shape (above).
- #10350 incoming tombstone timestamp. Cause: `deletedAt` was set to the string `"datetime('now')"`, bound as a parameter, so SQLite stored that text. `deletedAt IS NULL` filters still worked, so it went unnoticed. Lesson: SQL expressions cannot be bound parameters; a regression spec pins a real `yyyy-MM-dd HH:mm:ss` value (`buildFromSyncRecord.spec.ts`). Found by an audit (#10266).
- #10567 report session errors to central. Cause: mobile never told central a session failed locally, so it stayed open until central's own timeout, while facility servers already reported. Lesson: wrap push, pull and end in one try and report before rethrowing (`MSM:279-289`); the report itself is best-effort.

### N11 Error reporting from mobile and the device id

- Error reporting (#10567): `markSessionErrored` posts to `sync/:id/error` (`CSC:266-268`); central ends the session with the error (`buildSyncRoutes.js:380-394`). Unlike the facility (`FSM:229-234`) mobile does not filter out errors that came from central. Test: `MobileSyncManager.test.ts:168-186`. A kill or a failure before a session exists is not reported.
- Device id (#6677): the id used to be `mobile-<react-native-device-info unique id>`; now `mobile-<uuid v4>` generated once and kept in app config (`CSC:91-99`, diff in `85228b55d7`). `connect` became `async` so the id is read before first use. It is sent on session start, pull initiate, push complete, refresh and login (`CSC:223-367, 382`). The id lives in app storage, not the SQLite database, so restoring or clearing the database does not change it, and clearing app storage (`services/config.ts:5`) mints a new one.
- Device id on central (#8264): central and facility servers now get an id from a shared `initDeviceId` (`packages/shared/src/utils/initDeviceId.js:10-27`, `<type>-<shortid>` stored in the `deviceId` local fact, with a mismatch check against config). Mobile does not use it; its id is minted on the device. Central logs the device against the session and audit (`packages/central-server/app/auth/userMiddleware.js:34-35`, `admin/sync.js:82`).

### Other things a developer would need

- Settings read by mobile sync come from the login response, merged with facility settings on facility selection (`services/settings.ts:23-29`); missing values fall back to code defaults (crash fixed in #9934). The urgent interval is read from the pulled `Setting` rows instead.
- Tests that pin behaviour: `MobileSyncManager.test.ts` (order, error reporting, keep-awake), `MobileSyncManager.pull.test.ts`, `runSyncSaveTransaction.test.ts` (real SQLite commit failure path), `checkForeignKeys.test.ts`, `deferForeignKeys.test.ts`, `executePreparedQuery.test.ts`, `saveIncomingChanges.test.ts`, `snapshotOutgoingChanges.spec.ts`, `buildFromSyncRecord.spec.ts`, `manageSnapshotTable.test.ts`, `infra/db/index.test.ts`. None asserts the tick of an incoming row.
- The shared single query runner: `runSyncSaveTransaction.ts:17-21` states the drivers hand out one runner and release is a no-op. That is why app queries during a sync save join its transaction (`inference` for the consequence).

## Unresolved

- Whether a first install running `triggerFullResync` (the procedure migration runs on fresh installs, `1759957009000-...:204`) causes a duplicate-key failure on the initial path. Central would send the table twice (since -1 in the main snapshot and again for the full-resync snapshot, `CSM:593-628`), and the initial path uses plain inserts for everything but `User` (`saveIncomingChanges.ts:97-107`). I did not find where central de-duplicates; next step: read `findSyncSnapshotRecordsOrderByDependency` and the snapshot de-duplication, or run a fresh-install test against a central.
- Whether the UI blocks use during initial sync (MOB-34). Next step: trace navigation after `assignFacility` in `SelectFacilityScreen.tsx`.
- Whether TypeORM runs `@BeforeInsert/@BeforeUpdate` for `repository.insert(plain)` and `repository.update(criteria, plain)` (N2). Next step: read TypeORM 0.3.28 `InsertQueryBuilder` and `UpdateQueryBuilder`, or add a test with the real SQLite connection used by `runSyncSaveTransaction.test.ts`.
- Whether a failed `callWithBackoff` classification really retries bare network failures about 76 s (N7). Next step: read `Problem` and `BaseError` in `packages/errors/src/errors.ts` and run the existing `CSC` tests.
- Why the unsafe pragma stopped being the default (MOB-32); no PR body found. Next step: `gh pr list --search "useUnsafeSchemaForInitialSync"` and the settings default history.
- The central de-duplication of mobile `pull` pages and the `removeEchoedChanges` behaviour for mobile pushes belong to the central ledgers.
