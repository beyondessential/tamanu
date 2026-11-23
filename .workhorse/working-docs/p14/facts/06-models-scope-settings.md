# Fact sheet 06: models, scope, hooks, settings

Source ledger: `../ledger/09-models-triggers-settings.md` (MDL). Code at `22d3edaa36`. `DB` = `packages/database/src`.
Model counts are files in `DB/models/` declaring each direction (grep), approximate by a few.

## 1. Sync directions

Five values in `SYNC_DIRECTIONS` (`packages/constants/src/sync.ts`) [MDL-03].

| Direction | Meaning | Models | Examples |
| --- | --- | --- | --- |
| `bidirectional` | pushed and pulled | ~82 | `Patient`, `Encounter`, `SurveyResponse`, `ReferenceData` |
| `pull_from_central` | pulled only, never pushed | ~38 | `User`, `Role`, `Permission`, `Survey`, `Location`, `Setting` |
| `push_to_central` | pushed only, never pulled; central keeps it, facility keeps its copy | 4 | `DeathRevertLog`, `IPSRequest`, `ReportRequest`, `UserLoginAttempt` |
| `push_to_central_then_delete` | as push, then the facility hard-deletes its local copy after a successful push (`deleteRedundantLocalCopies` in `packages/facility-server/app/sync/`, `force: true`) | 4 | `Attachment`, `CertificateNotification`, `FacilitySettingMigration`, `PatientCommunication` |
| `do_not_sync` | no sync; no `updated_at_sync_tick` attribute; public-schema models must also be in `NON_SYNCING_TABLES` | ~31 | `SyncSession`, `SyncLookup`, `ChangeLog`, `RefreshToken`, `LocalSystemFact`, all `Fhir*` models |

- Mobile has no `push_to_central_then_delete`: four directions (`packages/mobile/App/models/types.ts`) [MDL-03].
- Which models are pushed or pulled: `getModelsForPush`, `getModelsForPull` (`DB/sync/getModelsForDirection.ts`) [MDL-03].

## 2. Scope: what decides which clients receive a record

Pull direction is not scope. Scope is decided per model by `buildSyncFilter` / `buildPatientSyncFilter` (non-lookup path) and `buildSyncLookupQueryDetails` (lookup table build) [MDL-03, MDL-07, MDL-31].

| Kind | How a model declares it | Examples |
| --- | --- | --- |
| Everywhere | `buildSyncFilter` returns `null`; lookup details return `null` (`|| {}` gives the default select, no scope columns) | `ReferenceData`, `User`, `Survey`, `Patient` (every patient row goes to every facility) |
| Patient (marked for sync) | `buildPatientSyncFilter`: `patient_id` in the marked-for-sync table. Generic builders: `buildPatientSyncFilterViaPatientId`, `buildEncounterLinkedSyncFilter` (table path to `encounters`), `buildNoteLinkedSyncFilter`; or custom SQL. Every patient builder returns `null` when no patients are marked (nothing pulled) | `PatientAllergy` (via `patient_id`), `Vitals` (via encounter), `Note` |
| Facility | filter `facility_id IN (:facilityIds)`; lookup select sets `facility_id` | `PatientFacility`, `ReferenceDrugFacility`, `LocationAssignment`, `Setting` (`OR scope = 'global'`), `Appointment` (and patient) |
| Sensitive network | lookup select carries `facilities.sensitive_network_id`, joined through `locations` and `facilities`, via `buildEncounterLinkedLookupSelect` / `buildEncounterLinkedLookupJoins` (`DB/sync/buildEncounterLinkedLookupFilter.ts`). Encounter data only: genuinely facility-bound records set `facility_id` and no network. Pull clause: `(facility_id IS NULL AND sensitive_network_id IS NULL) OR facility_id IN (:facilityIds) OR sensitive_network_id = :sensitiveNetworkId` (`snapshotOutgoingChanges.js`) | encounter-linked models (`Vitals`, `Procedure`); `AiDocument` polymorphic parent case |
| Lab request | lookup select sets `isLabRequestValue: 'TRUE'`; filter returns `''` when `syncAllLabRequests` | `LabRequest`, `LabTest`, `LabTestPanelRequest`, `LabRequestLog`, `LabRequestAttachment`; `Encounter` sets `is_lab_request` from `new_labs.encounter_id IS NOT NULL` |

- Why network clause tests both columns: a network-scoped record has a null `facility_id` too, so testing facility alone would admit every sensitive record (code comment in `snapshotOutgoingChanges.js`) [MDL-31].
- Network scoping exists only on the lookup path; the non-lookup model path reads no `sensitiveNetworkId` [MDL-31]. A session spanning more than one network is refused (`CentralSyncManager.js`) [MDL-31].
- Lab-request exception [MDL-30]: `... OR is_lab_request IS TRUE` sits outside both the patient clause and the network clause. A facility with facility-scope `sync.syncAllLabRequests` true gets every lab request, its tests and the parent encounter, even from a sensitive network. Applies only when session is not mobile and `since > -1` (initial pulls skip it). `specs/sync/sensitive-networks.md` states the ordering ("ahead of patient and network scoping"); it does not say the confidentiality consequence is intended, and its line "network scoping widens ... nothing else" is in tension with it. `inference`: unresolved product decision.
- There is no constant defining "reference data" for sync. `REFERENCE_TYPES` / `OTHER_REFERENCE_TYPES` (`packages/constants/src/importable.ts`) list importable types and drive import/export only. The set that syncs everywhere is "models whose `buildSyncFilter` returns `null`", which includes users, roles, permissions, surveys, programs, templates, report definitions, and excludes facility-scoped reference-style tables [MDL-05, MDL-06]. `reference_data` itself has no facility column [MDL-06].
- Marked-for-sync patient list is built by `createMarkedForSyncPatientsTable` (central) from `patient_facilities` [MDL-21].
- Detail of the filters is in fact sheets from ledgers 05 and 06.

## 3. What a new syncing model must declare

| Item | Enforced by |
| --- | --- |
| `syncDirection` in `init` | runtime: base `Model` throws (`Model.ts`); mobile entity constructor throws (`BaseModelWithoutId.ts`) [MDL-checklist] |
| Timestamps and tick attribute kept on a syncing model | runtime `Model.ts` init; test `databaseState.test.js` (syncing models have tick attribute, non-syncing do not) |
| Non-syncing public-schema table listed in `NON_SYNCING_TABLES` | runtime: `DB/services/database.js` throws. Public schema only; `logs` schema is not checked [MDL-14] |
| `buildSyncFilter` or `buildPatientSyncFilter` on pull/bidirectional | runtime: `validateSync` in `Model.ts` throws at init (comment: "to make sure it is considered") [MDL-07] |
| `buildSyncLookupQueryDetails` on pull/bidirectional (return `null` if global) | nothing: no base implementation; a miss is a `TypeError` in the first lookup build (`updateLookupTable.js`). No test [MDL-07] |
| Network carried on encounter-linked lookup select | test `DB/__tests__/sync/syncLookupFacilityScope.test.ts` [MDL-31] |
| `facilityId` only for genuinely facility-bound data; `isLabRequestValue` only for lab data | nothing |
| Soft delete only | nothing for sync; rule in `llm/project-rules/coding-rules.md` (Healthcare) [MDL-09] |
| Composite identity: stored generated `id` column | nothing (convention, section 6) [MDL-11] |
| Unique constraints and self-referencing FKs `DEFERRABLE` | tests `uniqueConstraintDeferrability.test.js` (named whitelist), `selfReferencingFkDeferrability.test.js`. Why: incoming sync applies rows in bulk, arbitrary order [MDL-12] |
| Mobile TypeORM entity with `static syncDirection`, registered in `packages/mobile/App/models/modelsMap.ts`, mobile migration | nothing for sync; mobile migration rule in `packages/database/CLAUDE.md` (explicit list in `App/migrations/index.ts`) [MDL-checklist] |
| Optional hooks: `incomingSyncHook`, `adjustDataPostSyncPush`, `sanitizeForCentralServer` / `sanitizeForFacilityServer` | nothing |

Already carried by rule files, not restated: migration split, backward compatibility, dbt models (`packages/database/CLAUDE.md`); fake data, reference-data provisioning, "never modify `updated_at_sync_tick`" (`llm/project-rules/coding-rules.md`); settings placement (`llm/project-rules/settings.md`). The tick and trigger columns are added by post-migration hooks, so not by hand [MDL-14].

## 4. Columns that never sync, and what does

- Excluded on every model, every path: `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick` (`COLUMNS_EXCLUDED_FROM_SYNC`, `DB/sync/constants.ts`; applied in `sanitizeRecord`, `buildSyncLookupSelect`, `snapshotOutgoingChanges.js`, `buildFacilityBootstrap.js`) [MDL-04]. Why: per-server bookkeeping (comment in a backfill migration) [MDL-04].
- No per-model outgoing exclusion exists on the server [MDL-04]. Mobile: `excludedSyncColumns = ['createdAt','updatedAt','updatedAtSyncTick']`; `Attachment` also excludes `filePath` [MDL-04].
- Surprise: the whole `User` row, including the bcrypt `password` hash, syncs to every facility, mobile device and into `sync_lookup.data`. `defaultScope` excludes `password` from ordinary reads only; sync builders read `getAttributes()` [MDL-02]. `inference`: needed for offline login (`llm/docs/authentication.md`); no code comment.
- Incoming-side sanitisers only (`saveIncomingChanges.ts`): `sanitizeForCentralServer`, `sanitizeForFacilityServer`, `prepareSanitizeContext`. Overrides: `Asset`, `Attachment`, `PatientCommunication`, `ReportRequest`, `ReferenceDrugFacility` (strips `quantity`, `stockStatus` where mSupply stock-on-hand is on, so a pull never overwrites stock) [MDL-04].
- Mobile pair `sanitizeRecordDataForPush` / `sanitizePulledRecordData` on seven mobile models [MDL-04].
- Row-level: `SurveyResponseAnswer` and `VitalLog` drop sensitive-survey answers for mobile sessions only (separate from sensitive networks) [MDL-04].
- `auth.restrictUsersToSync` (global, default false) gates whether a user may sync at all (`User.ts`) [MDL-24].

## 5. Deletes

1. Soft only: a delete is an update with `deleted_at` set; the lookup select emits `is_deleted`; `deletedAt` itself is never in the payload [MDL-09].
2. It travels as `isDeleted` on the snapshot row; the receiver applies it in `saveUpdates` (`DB/sync/saveChanges.ts`) [MDL-09].
3. Hard delete on a syncing table: no node is told; other nodes keep the row indefinitely [MDL-09].
4. Central only, lookup-tracked tables: AFTER DELETE trigger `delete_<table>_from_sync_lookup` flags the lookup row; the self-heal pass in `updateLookupTable.js` deletes it; a hard delete during a build aborts and retries. The deletion still never reaches facilities or mobile [MDL-09].
5. Changelog records hard deletes (`is_hard_delete`); the entry stays on the server that did it (`specs/audit/changelog.md`) [MDL-09].
- Sanctioned hard deletes: `push_to_central_then_delete` cleanup; patient merge `PatientFacility.destroy({ force: true })` (comment: "the only place where hard deletion is allowed"); non-syncing tables (discharge drafts, tokens) [MDL-09].

## 6. Primary keys

- Sync identifies a record by a single `id` column (`saveChanges.ts`, `sync_lookup.record_id`) [MDL-10].
- Composite database keys exist (read from migrations, not a live schema) [MDL-10, MDL-11]. Stored generated `id` expression (parts joined by `;`):

| Table / model | Generated `id` |
| --- | --- |
| `PatientFacility` | `patient_id;facility_id` |
| `PatientFieldValue` | `patient_id;definition_id` |
| `PatientProgramRegistration` | `patient_id;program_registry_id` (plus `UNIQUE (id)`) |
| `PatientOngoingPrescription` | `patient_id;prescription_id` |
| `PatientInvoiceInsurancePlan` | `patient_id;invoice_insurance_plan_id` |
| `ReferenceDrugFacility` | `reference_drug_id;facility_id` |
| `TranslatedString` | `string_id;language` |
| `UserPreference` | `user_id;key;COALESCE(facility_id,'')` |
| `AiDocument` | `type;record_type;record_id` |
| `PatientAdditionalData`, `PatientBirthData` | `patient_id` (model source omits `STORED`; baseline has it stored) |

- `lab_test_panel_lab_test_types` has a composite key; whether it has a generated `id` was not checked (unresolved) [MDL-10].
- Not sync-bearing: `SyncDeviceTick` (`id` from `persisted_at_sync_tick`), `SyncLookupTick` [MDL-11].
- Why (code comments): one row per pair even across a distributed system (`PatientFacility`); two facilities independently generating the same record (`AiDocument`) [MDL-10].
- Setters ignore `id`; `saveUpdates` strips `id` from `SET` (Postgres rejects writes to a generated column) [MDL-11]. A BEFORE ROW trigger sees NULL for a stored generated column, so the lookup flag trigger is AFTER [MDL-11].

## 7. Post-migration hooks

`POST_MIGRATION_HOOKS` in `DB/services/migrations/hooks/postMigrationHooks.ts`, run in this order after each migration batch, up and down (`migrations.js`). A hook whose prerequisite function or table is missing is skipped with a log [MDL-14]. Schemas covered: `public` and `logs` only; `fhir` gets none [MDL-14].

| Hook | Does | Tables | Server | Sync |
| --- | --- | --- | --- | --- |
| `addUpdatedAtSyncTickColumn` | adds `updated_at_sync_tick BIGINT NOT NULL DEFAULT n` (n = -999 facility, 0 central) plus index | all minus `GLOBAL_EXCLUDE_TABLES` (`SequelizeMeta`) and `NON_SYNCING_TABLES` (28) | both | yes |
| `addUpdatedAtTrigger` | `set_<table>_updated_at` BEFORE INSERT/UPDATE | same | both | no |
| `addOrReplaceUpdatedAtSyncTickTrigger` | drop and recreate `set_<table>_updated_at_sync_tick` | same | both | yes |
| `addOrReplaceSyncLookupDisabledFlagTrigger` | AFTER INSERT/UPDATE `flag_<table>_for_lookup_rebuild`; removes it where unwanted (also on a central-to-facility role change) | lookup-tracked: pull/bidirectional, public schema, minus exclusions | central | yes |
| `addSyncLookupDeleteTrigger` | AFTER DELETE `delete_<table>_from_sync_lookup` | lookup-tracked | central | yes |
| `reconcileNotifyTableChangedTrigger` | `notify_<table>_changed` AFTER INSERT/UPDATE/DELETE | central: `public.settings` plus every public table with a `patient_id` column not in `NON_SYNCING_TABLES`; facility: `appointments`, `notifications`, `settings`, `tasks` | both | central patient tables yes; `registerSyncLookupUpdateListener` re-queues children when a record's `patient_id` changes (merge) |
| `addRecordChangeTrigger` | deferred `record_<table>_changelog` calling `logs.record_change()` | all minus `GLOBAL_EXCLUDE_TABLES` and `NON_LOGGED_TABLES` | both | no |
| `enableSyncTickTrigger` | not a trigger: sets fact `syncTrigger` to `enabled` | n/a | both | yes |

- Quirk: `logs.accesses` and `logs.changes` are `DO_NOT_SYNC` but not in `NON_SYNCING_TABLES`, so they got tick columns and triggers from the baseline; whether intended is unresolved [MDL-14].
- Stale comment in `sync.ts` points to `shared/src/services/migrations/constants.js`; list is at `DB/services/migrations/constants.ts` [MDL-14].
- Trigger functions live in migrations: find the latest definition (`1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts` for `set_updated_at_sync_tick`, the flag function) [MDL-17].

## 8. Migrations and sync

1. `PRE_MIGRATION_HOOKS = [disableSyncTickTrigger]` (`preMigrationHooks.ts`) upserts fact `syncTrigger = 'disabled'` before each batch (up and down). The trigger is not dropped [MDL-18].
2. `set_updated_at_sync_tick()` returns `NEW` unchanged while disabled, so rows keep their tick [MDL-18].
3. `enableSyncTickTrigger` sets it back after the batch [MDL-18].
4. If the batch fails between the hooks, the flag stays `disabled` until the next successful run (clock ledger CLK-16) [MDL-18]. Data migrations can use `disableSyncTrigger` (`DB/dataMigrations/index.js`), which should be wrapped in a transaction or the flag stays disabled on a throw [MDL-18].
- Why (comment): migrations are deterministic, so bumping ticks would sync large amounts of data needlessly [MDL-18].
- A comment in `1784843046612-backfillNullCreatedUpdatedAtTimestamps.ts` still says the trigger is dropped: stale [MDL-18].
- Why each server migrates its own data: every server runs the same deterministic migration in place; facilities keep no lookup table, and newly marked patients pull from central's lookup, so the lookup must hold the migrated form (transcript only, `unverifiable` beyond that) [MDL-19].
- Data migration on lookup-tracked tables, central: any write in the disabled window fires the AFTER flag trigger, which sets `needs_rebuild` on the lookup row (stubbing one if absent); hard deletes are flagged by the delete trigger; the migration run ends with a lookup rebuild including self-heal and the upgrade does not finish until none are flagged (`specs/sync/lookup-table.md`). So edits to those rows need no extra step [MDL-19].
- Not covered: lookup `patient_id`, `facility_id`, `sensitive_network_id`, `encounter_id` come from joins at build time, so a change to a parent row that moves children's scope flags them only if they are written. Use facts `lookupModelsToRebuild` / `lookupPatientsToRebuild` (`packages/constants/src/facts.ts`; example `1787615019000-flagMergedPatientsForLookupRebuild.ts`) [MDL-19].
- Mobile migrations differ: they ask central to resend (MOB-16/17) [MDL-19].
- Migrations importing app code: `1793235590139-...` imports a post-migration hook (behaviour changes with the hook); `1775525218612-...` imports `globalDefaults` from `@tamanu/settings`; others only read `config` to tell central from facility [MDL-20].
- Rule files: `packages/database/CLAUDE.md` has DDL/DML, destructive, backward-incompatible, dbt; no mention of tick, lookup or `lookupModelsToRebuild`. `coding-rules.md` has bulk-update FHIR warning and "never modify `updated_at_sync_tick` manually"; nothing on migrations and sync. `llm/docs/initial-overview.md` describes the trigger, not the disabled mode. Only `specs/sync/lookup-table.md` and code state it [MDL-19].

## 9. Marking patients for sync

Paths that create a `patient_facilities` row [MDL-21]:
1. Encounter single create: `onCreateEncounterMarkPatientForSync` (ORM `afterCreate`, `INSERT ... ON CONFLICT DO NOTHING`, facility of encounter location). Not fired by sync writes (`bulkCreate` with `hooks: false`), by design.
2. `POST /patientFacility` (`facility-server/app/routes/apiv1/patientFacility.js`): needs `read Patient` and `create SyncPatient`, `findOrCreate`, triggers urgent sync.
3. Patient created on a facility server (`patient/patient.js`).
4. Program registry registration (`patientProgramRegistration.js`, `upsert`).
5. Outpatient appointment and location booking (`appointments.js`, `findOrCreate`).
6. Mobile `Patient.markForSync` (create or edit).
7. Patient merge `reconcilePatientFacilities` (`mergePatient.js`): hard-deletes old rows, bulk-creates new ones for every facility tracking either patient, so facilities resync from scratch.
8. Also: demo generator `kioskDemo.js`; one upgrade step re-ticking existing rows (no create); rows reaching other nodes via ordinary bidirectional sync.
- `specs/sync/marking-patients-for-sync.md` (MFS) lists 1, 3, 4, 5, 6 as automatic and 2 as the `SyncPatient` action; it does not list the merge or discuss unmarking.
- No UI, API or task removes a mark; only the merge reconcile does (hard delete then recreate). A `deletedAt` exists but nothing soft-deletes a row [MDL-21, MDL-22].
- Unmarking: `unverifiable`. No spec, runbook or SOP covers it. `inference`: because hard deletes do not propagate, removing the central row would leave the patient's data on the facility; what should happen to local data and a later re-mark is documented nowhere [MDL-22].

## 10. Settings and config

Central config (`packages/central-server/config/default.json5`) [MDL-24]:

| Key | Where | Default | Controls |
| --- | --- | --- | --- |
| `sync.maxConcurrentSessions` | config | 4 | active sessions before others queue |
| `sync.persistedCacheBatchSize` | config | 20000 | batch size persisting pushed records |
| `sync.pauseBetweenPersistedCacheBatchesInMilliseconds` | config | 50 | pause between those batches |
| `sync.adjustDataBatchSize` | config | 20000 | batch for post-push adjustment |
| `sync.incomingSyncHookBatchSize` | config | 20000 | batch for `incomingSyncHook` |
| `sync.numberConcurrentPullSnapshots` | config | 4 | concurrent pull snapshot builds |
| `sync.persistUpdateWorkerPoolSize` | config | 5 | parallel updates in `saveUpdates` |
| `sync.maxRecordsPerSnapshotChunk` | config | 1000000000 (effectively off) | chunking of snapshot inserts |
| `sync.syncSessionTimeoutMs` | config | null | session timeout |
| `sync.snapshotTransactionTimeoutMs` | config | null | pull snapshot transaction timeout |
| `sync.lookupTable.enabled` | config | true (test config false) | **ROLLOUT FLAG**: pull from `sync_lookup` or from the models |
| `sync.lookupTable.perModelUpdateTimeoutMs` | config | null | statement timeout per model lookup build |
| `sync.lookupTable.avoidRepull` | config, not settings | true | **ROLLOUT FLAG**: exclude records pushed by the pulling device |
| `sync.awaitPreparation` | config | unset (tests true) | wait for snapshot preparation inside `startSession` |
| `patientMerge.updateDependentRecordsForResyncEnabled` | config | true | merge resync of dependent records |
| `tasks.syncLookupRefresher` (`enabled`, `schedule`) | config and settings schema (`central.ts`) | enabled, `*/20 * * * * *` | when the lookup build runs; code reads `context.schedules`, precedence untraced (unresolved) |

Central settings (`packages/settings/src/schema/central.ts`):

| Key | Default | Controls |
| --- | --- | --- |
| `sync.maxFlaggedPatientsPerBuild` | 1000 | merge-flagged patients rederived per lookup build |
| `sync.streaming.enabled` | false | streaming sync |
| `sync.streaming.databasePollBatchSize` | 100 | stream poll batch |
| `sync.streaming.databasePollInterval` | 1000 ms | stream poll interval |
| `mobileSync.*` (exposed to web, high risk) | `useUnsafeSchemaForInitialSync` false, `maxBatchesToKeepInMemory` 5, `maxRecordsPerInsertBatch` 2000, `maxRecordsPerUpdateBatch` 2000, `maxRecordsPerSnapshotBatch` 1000, `dynamicLimiter` {`initialLimit` 10000, `minLimit` 1000, `maxLimit` 40000, `maxLimitChangePerPage` 0.3, `optimalTimePerPage` 10000 ms} | mobile pull batching and adaptive page size |

- Key mismatch [MDL-27]: `buildSyncRoutes.js` reads `sync.databasePollInterval` (twice) and `sync.databasePollBatchSize`, but the schema declares them under `sync.streaming.`. Confirmed by grep. Effect of an unknown path in `ReadSettings.get` not checked (unresolved).

Facility settings (`facility.ts`) and global [MDL-24]:

| Key | Default | Controls |
| --- | --- | --- |
| `sync.syncAllLabRequests` (facility) | false | lab-request exception to scoping (section 2) |
| `sync.urgentIntervalInSeconds` (facility) | 10 | mobile urgent sync interval |
| `auth.restrictUsersToSync` (global) | false | whether a user may sync at all |

Facility config (`packages/facility-server/config/default.json5`) [MDL-24]:

| Key | Default | Controls |
| --- | --- | --- |
| `sync.enabled` | true | sync on or off |
| `sync.schedule` | `*/1 * * * *` | sync cadence |
| `sync.jitterTime` | `1s` | schedule jitter |
| `sync.timeout` | 10000 | request timeout |
| `sync.host`, `sync.email`, `sync.password` | deprecated fallbacks (now facts / `SYNC_URL`) | central connection |
| `sync.syncApiConnection.{host,port}` | n/a | central connection |
| `sync.persistedCacheBatchSize` | 10000 | push persist batch |
| `sync.pauseBetweenPersistedCacheBatchesInMilliseconds` | 50 | pause between batches |
| `sync.pauseBetweenCacheBatchInMilliseconds` | 50 | pause between cache batches |
| `sync.persistUpdateWorkerPoolSize` | 5 | parallel updates |
| `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` | true | assertion in `FacilitySyncManager.js` |
| `sync.backoff` | `multiplierMs` 300, `maxAttempts` 15, `maxWaitMs` 10000 | retry backoff |
| `sync.dynamicLimiter` | `initialLimit` 10, `minLimit` 1, `maxLimit` 10000, `optimalTimePerPageMs` 2000, `maxLimitChangePerPage` 0.2 | adaptive page size |

- Mobile: no config file; takes `mobileSync` and `sync.urgentIntervalInSeconds` from settings at login; defaults duplicated in `packages/mobile/App/services/sync/utils/calculatePageLimit.ts` and `App/constants/settings.ts` [MDL-24].
- Facts, not settings: `syncTrigger`, `currentSyncTick`, `lookupModelsToRebuild`, `lookupPatientsToRebuild` [MDL-24].
- Rollout flags: `sync.lookupTable.enabled` and `sync.lookupTable.avoidRepull` (transcript: original developer wants both removed). The non-lookup path is live code with no network scoping, so `enabled: false` is not a safe fallback [MDL-24, MDL-31]. Possible gap with `avoidRepull` and field-wise merge (LKP-35) is `inference`, untested.
- Rule `llm/project-rules/settings.md` says tuning belongs in settings; all of the above tuning keys are in config [MDL-24].
