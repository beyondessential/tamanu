# Populating the sync lookup table (LKP)

Code is the worktree at main, `22d3edaa36` plus the ledger commit. Paths are relative to the repository root. "T1" is the long repeatable-read build transaction, "T2" is the short after-commit transaction that retags pending rows. Sequelize behaviour was read from `sequelize@6.37.3` in another checkout on this machine (this worktree has no `node_modules`); `package-lock.json` pins 6.37.8, so the commit-hook and CLS behaviour quoted below should be re-checked against 6.37.8 before it is documented as fact.

## Drift

- LKP-03 The lookup row holds `data json` (not JSONB). Minor.
- LKP-11 / LKP-16 The client's pull tick is not "based on the lookup table's version of the database". `pullUntil` is the central clock tick taken at pull setup (`CentralSyncManager.js:467-480`). The lookup only decides *which rows exist* at that moment, and rows are retagged with a fresh tick after each build so they land after any pull tick already handed out.
- LKP-20 Model timings are debug-log output only. Nothing cancels a build on a slow model; the only cut-off is the optional `perModelUpdateTimeoutMs` statement timeout (default null).
- LKP-30 `avoidRepull` is not in settings. It is a config-file key, `sync.lookupTable.avoidRepull` (default true), read through the `config` module. The "defaults to true" part is right.
- LKP-05 / LKP-36 The refresher interval is a setting, but it is a cron expression with a seconds field (`*/20 * * * * *`), not an interval, and is read once at startup.
- LKP-42 "Don't block sync sessions from reading the lookup" is not the real blocker: Postgres reads never block on writers. What a build that stamped real ticks would have to block is session *start* (the tick-tock), for the whole build.
- LKP-43 "The readers are on read committed" is wrong for pulls. The pull snapshot of `sync_lookup` runs inside a repeatable-read transaction (`CentralSyncManager.js:571`). The refresher's T2 is read committed (default).
- LKP-44 / Q4 "Nothing in this transaction makes them wait" is contradicted by the code: `tickTockGlobalClock` is an `UPDATE` on the `currentSyncTick` row, it runs inside T2 via CLS, so T2 holds that row lock until commit. (Settings table is also the wrong table: it is `local_system_facts`.) Whether the lock closes every interleaving is left open, see the Q4 section.
- LKP-35 The merge/hook same-transaction question has an answer that is not "handled" in general: only models whose `incomingSyncHook` returns changes get `requires_repull`. A field-wise merge (only `patient_additional_data` has `updated_at_by_field`) carries the persist tick and is attributed to the pusher.
- Spec gap: `specs/sync/lookup-table.md` says "two passes". The build has three: incremental, flagged-patient rebuild, self-heal. The spec also does not cover `pushed_by_device_id`, the pending flag in detail, or the per-model rebuild fact.

## Claims

### LKP-01 Push and pull are independently atomic; a failed pull still keeps the push
Source: Part 1 00:44:31
Verdict: confirmed
Evidence: `packages/facility-server/app/sync/FacilitySyncManager.js:224-227` runs `pushChanges` then `pullChanges` in order, so a failed push skips the pull. `FacilitySyncManager.js:326` writes `FACT_LAST_SUCCESSFUL_SYNC_PUSH` at the end of `pushChanges`, before the pull. Central commits the push in its own transaction (`CentralSyncManager.js:752-788`).
Why: no comment states the reason; the transcript's reason (stranded records are the bigger risk) is not in code. `inference` that it is deliberate.
Notes: the session as a whole is still marked errored (`FacilitySyncManager.js:229-234`), so "marked successful" applies to the push cursor only. Outside this area; another ledger owns it.

### LKP-02 The lookup table was not in the first version and is now a core performance feature
Source: Part 1 00:44:31
Verdict: confirmed
Evidence: introduced by PR #6167 (2024-09-06, "SAV-744: Sync lookup table"; also #6407 for 2.16.1). `packages/central-server/config/default.json5:58-62` has `sync.lookupTable.enabled: true`. The pre-lookup per-model snapshot path still exists and runs when `enabled` is false (`packages/central-server/app/sync/snapshotOutgoingChanges.js:354-376`). `packages/central-server/config/test.json5:23-26` sets `enabled: false` for the test environment, so lookup tests override it.
Why: not stated in the PR body (just "Sync lookup table").
Notes: `enabled` only controls the read side and the "built at all" guard (LKP-39b). The refresher task runs whether or not it is enabled.

### LKP-03 The lookup holds a JSONB copy of the record, its tick, and shortcut columns
Source: Part 1 00:45:36
Verdict: partly
Evidence: `packages/database/src/models/SyncLookup.ts:29` `data: { type: DataTypes.JSON, allowNull: true }`; baseline `packages/database/src/migrations/000_baseline.sql:3979-3992` `data json NOT NULL`, relaxed to nullable by `1784601991763-addNeedsRebuildToSyncLookup.ts:13-16` for stub rows. The JSON is built by `json_build_object` over every model attribute except `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick` (`packages/database/src/sync/buildSyncLookupSelect.ts:45-49`, `packages/database/src/sync/constants.ts:6-11`).
Why: n/a.
Notes: keys are the model's camelCase attribute names; values come from the snake_case columns.

### LKP-04 Before the lookup, each table's "does this go to this facility" logic ran at snapshot time; notes are the deepest case
Source: Part 1 00:45:36, 00:46:44
Verdict: confirmed (code); the "biggest table" claim is unverifiable from code
Evidence: legacy path `snapshotOutgoingChanges.js:15-142` (`snapshotChangesForModel`, uses `model.buildPatientSyncFilter` / `buildSyncFilter`). Note is polymorphic: `packages/database/src/models/Note.ts:132-139` builds its lookup from `buildEncounterLinkedLookupSelect` plus `buildNoteLinkedJoins()` and patient id from `getPatientIdColumnOfNotes()`; `Note.ts:141` still has `buildPatientSyncFilter = buildNoteLinkedSyncFilter`.
Why: n/a.
Notes: each pull model therefore carries two filter implementations (old per-session filter, new lookup select). `Model.validateSync` (`packages/database/src/models/Model.ts:106-131`) only enforces the old one (`buildSyncFilter` or `buildPatientSyncFilter`); it does not check that `buildSyncLookupQueryDetails` exists. See "Not in the transcript".

### LKP-05 A separate process runs every 20 seconds to populate the table
Source: Part 1 00:47:45; Part 3 00:14:01
Verdict: confirmed, with the interval detail corrected (LKP-39)
Evidence: `packages/central-server/app/tasks/SyncLookupRefresher.js:4-22`; registered at `packages/central-server/app/tasks/index.js:75`; schedule default `packages/settings/src/schema/central.ts:935` `syncLookupRefresher: scheduledTaskSchema({ schedule: '*/20 * * * * *' })`; also still in `packages/central-server/config/default.json5:263-266`.
Why: n/a.
Notes: runs in the central tasks process (`packages/central-server/app/subCommands/startTasks.js:36`), not the API process.

### LKP-06 One lookup table for all models, with patient id, record id, data, tick, row id, record type
Source: Part 1 00:47:45
Verdict: confirmed (more columns than listed)
Evidence: see Q11 below for the full schema. Unique on `(record_id, record_type)` (`000_baseline.sql:6387-6391`).
Why: n/a.

### LKP-07 Snapshotting becomes one query against indexed columns
Source: Part 1 00:48:54
Verdict: confirmed, with nuance
Evidence: `snapshotOutgoingChanges.js:259-300` is one chunked `INSERT ... SELECT FROM sync_lookup` per call. `setupSnapshotForPull` calls it up to three times (new-patient full pull, regular pull, optional full-resync tables: `CentralSyncManager.js:580-628`), each inside the one repeatable-read transaction opened at `:571`. Predicate: `updated_at_sync_tick > :since AND data IS NOT NULL AND (patient clause AND scope clause OR is_lab_request)`.
Why: n/a.
Notes: indexes are in Q11. `facility_id` alone is not indexed; the composite `(updated_at_sync_tick, record_id, patient_id, facility_id)` and `patient_id` are.

### LKP-08 Pushed records reach another facility after a delay of up to 20 seconds plus build time
Source: Part 1 00:48:54
Verdict: confirmed
Evidence: cron interval above; the build is two stages (T1 then T2), and rows only become pull-visible when T2 commits (LKP-44).
Why: n/a.
Notes: the delay also includes the wait for in-flight edits at `CentralSyncManager.js:341`.

### LKP-09 The queries run once per refresh instead of once per client sync
Source: Part 1 00:50:00
Verdict: confirmed
Evidence: per-model build queries are in `updateLookupTable.js:124-185`, run only from the refresher/upgrade/rebuild paths; pulls read `sync_lookup` only.
Why: n/a.

### LKP-10 Patient-less rows sync everywhere; facility-scoped tables use a facility id; query is "patient marked here, or this facility, or neither"
Source: Part 1 00:50:00, 00:51:04; Part 2 01:10:35 context
Verdict: partly (the real predicate is stricter)
Evidence: `snapshotOutgoingChanges.js:259-300`. Patient clause (`getPatientRelatedWhereClause`, `:196-211`) is `patient_id IN (marked patients)` for patient-linked record types, or `(patient_id IS NULL OR patient_id IN (...))` when other types are in the call. Scope clause is `(facility_id IS NULL AND sensitive_network_id IS NULL) OR facility_id IN (:facilityIds) [OR sensitive_network_id = :sensitiveNetworkId]` (`:275-283`), ANDed with the patient clause. Patients themselves return `null` from `buildSyncLookupQueryDetails` (`packages/database/src/models/Patient.ts:350-352`), so `patient_id` is NULL and they sync to every facility.
Why: the `facility_id IS NULL AND sensitive_network_id IS NULL` form is explained by the comment at `:271-274` (a network-scoped row also has a null facility id).
Notes: when `syncAllLabRequests` is on, `OR is_lab_request IS TRUE` (`:288-292`) sits at the same level as the patient-and-scope group. With SQL precedence the lab-request OR bypasses both the patient and the scope clauses. That is presumably intended ("sync all lab requests") but means a lab row skips the sensitive-network guard unless its own select prevents it; `inference`, not tested.

### LKP-11 The lookup's version of a record's tick differs from when it was pushed, so the pull tick has to be reasoned about against the lookup's timeline
Source: Part 1 00:51:04, 00:54:51, 00:56:33
Verdict: partly
Evidence: row ticks are assigned in T2 (`CentralSyncManager.js:363-364`, `updateLookupTable.js:507-521`) from a fresh tick-tock, not copied from the source row (except on initial build, LKP-42, and on heal, LKP-54). A pull's `pullUntil` is its own tick-tock (`:467`, `:477-480`).
Why: stamping at lookup-commit time is what makes a lagging lookup safe: a client whose `since` already passed the source tick will still see a row that got its lookup tick later (comments `:373-377`; transcript LKP-46).
Notes: the claim that the client tick is "based on the lookup table's version of the database" is wrong; see Drift.

### LKP-12 Why it is not a materialised view (speculation)
Source: Part 1 00:52:15, 00:53:52
Verdict: unverifiable
Evidence and answer: see Q12 below. No code comment, spec, PR body or commit message found in this repository addresses it.
Why: `inference` only.

### LKP-13 Queries are slow so they are batched; no order needed because there are no key constraints; refresh is atomic
Source: Part 1 00:53:52
Verdict: confirmed, with nuance
Evidence: chunking by `config.sync.maxRecordsPerSnapshotChunk` (`updateLookupTable.js:132`, `:144-177`); the default is `1000000000`, "essentially off" per the comment at `packages/central-server/config/default.json5:53-55`. Optional per-model `SET LOCAL statement_timeout` (`updateLookupTable.js:38-44`). Models are looped in `Object.values(getModelsForPull(models))` order with no dependency ordering (`:392`). `sync_lookup` has no foreign keys (baseline has none on it). Atomic: the whole incremental build is one repeatable-read transaction (`CentralSyncManager.js:350-415`).
Why: comment at `CentralSyncManager.js:408-410` explains writing the up-to fact inside the same transaction "so the next update can still detect the records that failed".
Notes: batching happens inside one transaction, so a "batch" is not a commit boundary. Atomic here covers row contents; the final tick of the rows is set one transaction later (LKP-43).

### LKP-14 Persisting incoming changes ticks twice; changes made on the way in need echoing back
Source: Part 1 00:54:51 (and Part 2 01:33:33 context)
Verdict: confirmed
Evidence: `CentralSyncManager.js:763` first tick-tock (uses `tock`), `:775-782` saves `savedAtSyncTick: tock` and writes `SyncDeviceTick`, `:787` second tick-tock "so records subsequently modified do not share the same tick as the incoming changes". Post-persist `adjustDataPostSyncPush` and `bumpSyncTickForRepull` run after the transaction (`:790-793`).
Why: comments `:758-762` and `:784-786`.
Notes: the transcript's "corrected" wording (tick before/after "the one given to the client") is loose: the client's tick is not given during persist; it comes at pull setup.

### LKP-15 Concurrency control has two levels, both using advisory locks
Source: Part 1 00:56:33, 00:58:08
Verdict: partly
Evidence: advisory locks: session-processing lock (`CentralSyncManager.js:277-293`), in-flight-edit share locks taken by `set_updated_at_sync_tick` (`1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:57-60`), exclusive waits (`packages/database/src/sync/waitForPendingEditsUsingSyncTick.ts:6-14`). But the clock row itself is a row lock, not an advisory lock, and it is a concurrency primitive too (Q4; also `packages/central-server/app/admin/importer/importerEndpoint.js:91-103` takes `FOR UPDATE` on it deliberately).
Why: n/a.
Notes: owned by the clock/lock ledger; included only because the range covers it.

### LKP-16 Client pull tick is based on the lookup's (lagging) version of the database
Source: Part 1 00:56:33
Verdict: partly (see LKP-11)

### LKP-17 syncAllLabRequests adds an OR for `is_lab_request` and the record types being synced
Source: Part 2 01:13:26
Verdict: partly
Evidence: `snapshotOutgoingChanges.js:288-292` adds `OR is_lab_request IS TRUE`; the `AND record_type IN (:recordTypes)` is a separate top-level AND (`:296`), not inside the OR. So "and record type in the types being synced" is right in effect (the OR is still bounded by `record_type IN`), but the structure is as in LKP-10 notes.
Why: n/a.
Notes: `sessionConfig.syncAllLabRequests` is false for mobile and for initial pulls (`CentralSyncManager.js:562`).

### LKP-18 Avoid-repull records the pushing device on the lookup row, replacing "remove echoed changes"
Source: Part 2 01:13:26
Verdict: partly
Evidence: `pushed_by_device_id` written by the upsert (`updateLookupTable.js:115`) and filtered on read (`snapshotOutgoingChanges.js:296-299`). But `removeEchoedChanges` is still called on every pull (`CentralSyncManager.js:631`), in lookup mode too; it is just mostly a no-op for rows the device filter already excluded.
Why: PR #6545 (2024-10-14, "SAV-837: Avoid repull pushed changes ... when using sync lookup").
Notes: details in Q7.

### LKP-19 `updateLookupTable` goes through the models; each model defines its own population logic
Source: Part 2 01:14:50
Verdict: confirmed
Evidence: `updateLookupTable.js:392-428` loops `outgoingModels`; each calls `model.buildSyncLookupQueryDetails(sessionConfig)` (`:141`). About 120 models define it (grep of `packages/database/src/models`).
Why: n/a.

### LKP-20 Model timings are there to cancel slow builds or just for debugging
Source: Part 2 01:16:21
Verdict: partly / wrong on cancel
Evidence: `updateLookupTable.js:381-384` and `:406-409` collect `modelTimings` (only models with rows or at least 1 s, `:19`, `:407`) into the `DebugLog` row (`:462`). No code reads them to decide anything. Cancellation is only via `perModelUpdateTimeoutMs` (`:38-44`, `config.sync.lookupTable`, default null).
Why: comment at `:18` "so its debug log keeps only the models that did some work".
Notes: `SET LOCAL statement_timeout` lasts to the end of T1, so it also applies to later statements in the transaction (patient pass, heal pass), `inference` from Postgres semantics.

### LKP-21 There is handling for concurrent hard delete (serialization failure), patient ids to rebuild, flagged patients, and a model rebuild
Source: Part 2 01:16:21
Verdict: confirmed
Evidence: see Q8 and Q9; `updateLookupTable.js:12-16`, `:386-390`, `:430-460`, `:394-413`.

### LKP-22 Mobile "request everything for a table from scratch" is a resync, distinct from a lookup model rebuild
Source: Part 2 01:19:05
Verdict: confirmed
Evidence: `tablesForFullResync` is a pull parameter that snapshots those tables with `since = -1` (`CentralSyncManager.js:613-628`); the lookup model rebuild is the `lookupModelsToRebuild` fact (`packages/constants/src/facts.ts:16`, `LocalSystemFact.ts:109-136`). Different mechanisms.

### LKP-23 Lookup rebuilds are done at the end of migrations and sometimes manually; the lookup drifts when a change does not bump `updated_at_sync_tick`; migrations turn the tick trigger off
Source: Part 2 01:19:05
Verdict: confirmed
Evidence: `packages/database/src/services/migrations/hooks/preMigrationHooks.ts:5-20` sets `syncTrigger = 'disabled'` (the mid-sentence correction is right: it is disabled, not dropped). Re-enabled by `enableSyncTickTrigger` (`postMigrationHooks.ts:272-283`). ~28 migrations call `flag_lookup_model_to_rebuild(...)` (function in `000_baseline.sql:854-873`); example `1793227715109-rebuildLookupTableForInsurancePlanPaymentsRename.ts:18-20` and `1786598015143-createEncounterDischargeDrafts.ts:146-150`. Manual route: `rebuildSyncLookup` subcommand (`packages/central-server/app/subCommands/rebuildSyncLookup.js`) and the upgrade gate (Q9).
Why: `preMigrationHooks.ts:11-13` "Migrations are deterministic, so updating the sync tick causes us to unnecessarily sync large amounts of data". PR #10485 for the disabled-mode design.
Notes: no runbook under `docs/` mentions `flag_lookup_model_to_rebuild`; the only on-call path in docs is none. The fresh-database baseline seeds `lookupModelsToRebuild = 'prescriptions,encounter_prescriptions'` (`000_baseline.sql:4740`), harmless on an empty database.

### LKP-24 Deterministic in-place migrations are why the tick trigger is off; a newly marked patient's data must be right in the lookup because it was not migrated in place at the facility
Source: Part 2 01:20:37
Verdict: confirmed (first half); second half `inference`
Evidence: comment at `preMigrationHooks.ts:11-13`. The example (patient first marked for sync pulls from -1) is consistent with the flow in `setupSnapshotForPull` (`:493-517`, `:580-592`, full pull from -1) but no comment states it.
Why: as quoted.

### LKP-25 State is flagged via local system facts
Source: Part 2 01:20:37, 01:21:34
Verdict: confirmed
Evidence: three facts in `local_system_facts`: `syncTrigger` (`FACT_SYNC_TRIGGER_CONTROL`, read by the triggers), `lookupModelsToRebuild`, `lookupPatientsToRebuild` (`packages/constants/src/facts.ts:15-17`), plus `lastSuccessfulLookupTableUpdate` (`FACT_LOOKUP_UP_TO_TICK`, `:14`) and the clock `currentSyncTick` (`:11`).
Notes: `LocalSystemFact.set` is a read-then-write (`LocalSystemFact.ts:48-64`) with a comment that "something spooky in the sync code relies on this exact implementation"; it is what writes the up-to fact (`CentralSyncManager.js:414`).

### LKP-26 Patients are flagged for rebuild after a merge; blame shows the model rebuild is older and the patient rebuild is the merge fix
Source: Part 2 01:21:34
Verdict: confirmed
Evidence: PR #10862 (2026-09-06, "flag merged patients for sync lookup rebuild"), migration `1787615019000-flagMergedPatientsForLookupRebuild.ts` plus seed `1787615019001-seedMergedPatientsForLookupRebuild.ts`. Callers: `packages/central-server/app/admin/patientMerge/mergePatient.js:476-481` and `packages/central-server/app/tasks/PatientMergeMaintainer.js:130-135`. `flag_lookup_model_to_rebuild` already exists in the migration baseline (`000_baseline.sql:854`).
Why: PR #10862 body: a merge leaves lookup rows scoped to the merged-away patient wherever scope derives through other tables' joins; those records reach no facility, and a child that does sync can halt a facility pull on a foreign-key violation.
Notes: capped by setting `sync.maxFlaggedPatientsPerBuild` (default 1000, `packages/settings/src/schema/central.ts:225-231`), applied at `updateLookupTable.js:386-390`.

### LKP-27 Why the model rebuild takes a separate flag rather than since = -1
Source: Part 2 01:23:10
Verdict: confirmed (reason found; a partly `inference` on intent)
Evidence: `buildSyncLookupSelect.ts:14-28`. A full rebuild selects all rows (`updated_at_sync_tick > -1`, `updateLookupTable.js:155-158`, overriding a model's custom `where`) but still needs the real `since` for `CASE WHEN source_tick <= :since THEN source_tick ELSE COALESCE(:updatedAtSyncTick, source_tick) END` (`buildSyncLookupSelect.ts:25-27`): rows unchanged since the last build keep their historic tick so clients do not re-pull them, rows changed since get the pending flag. Passing `since = -1` would lose that boundary.
Why: comment `buildSyncLookupSelect.ts:14-20`. A test pins the behaviour of the custom-`where` case: `CentralSyncManager.updateLookupTable.test.js:363` ("rebuilds a model with a custom sync lookup filter (encounters)").
Notes: because the upsert overwrites `updated_at_sync_tick` with the historic tick, a full rebuild can move an existing row's lookup tick *backwards* (to its source tick). Consequence: a full rebuild never makes clients re-pull unchanged records, even if the point of the rebuild was to change their JSON. The sensitive-networks spec states the same ("any later full lookup rebuild takes their ticks back from the source records", `specs/sync/sensitive-networks.md:116`).

### LKP-28 `buildSyncLookupQueryDetails` selects patient id, facility id, sensitive network id and is-lab-request for rows updated since
Source: Part 2 01:24:25
Verdict: confirmed (see Q6 for full return shape)

### LKP-29 `buildLookupUpsertQuery` is dense raw SQL doing an upsert paged by a record-id cursor
Source: Part 2 01:24:25, 01:30:17
Verdict: confirmed
Evidence: `updateLookupTable.js:27-122`; paging: `ORDER BY ${table}.id LIMIT :limit` (`:92-93`), cursor `fromId = maxId` from `MAX(record_id)` of the `RETURNING` (`:119-175`).
Notes: `MAX(record_id)` is a text maximum while the next page filters `${table}.id > :fromId`; this is only consistent while each model's `id` orders the same as its text form. All current ids are text-like, so no failure is known, but `record_id` was widened to text in `1780449878598` (`inference` that some ids are not varchar).

### LKP-30 Avoid-repull is a rollout feature flag, defaults true, "in settings now"
Source: Part 2 01:24:25, 01:26:13
Verdict: partly (see Drift)
Evidence: read as `config.sync.lookupTable.avoidRepull` (`updateLookupTable.js:133`, `snapshotOutgoingChanges.js:231`); defined only in `packages/central-server/config/default.json5:58-62` (`"avoidRepull": true`). There is no `avoidRepull` in `packages/settings/src/schema/`.
Why: PR #6545 added it after launch. Whether it is "a rollout flag to remove" is `inference`: nothing in code marks it temporary.
Notes: `llm/project-rules/settings.md` says new tunables belong in settings, so this predates that rule. Test: `CentralSyncManager.syncLookup.test.js:1496-1600` (enabled and disabled).

### LKP-31 Left join on `sync_device_ticks` where persisted tick equals the table's `updated_at_sync_tick`
Source: Part 2 01:26:13
Verdict: confirmed
Evidence: `updateLookupTable.js:82-87`: `LEFT JOIN sync_device_ticks ON persisted_at_sync_tick = ${table}.updated_at_sync_tick` when `avoidRepull`, else `LEFT JOIN (select NULL as device_id) AS sync_device_ticks ON 1 = 1`. `buildSyncLookupSelect.ts:44` selects `sync_device_ticks.device_id` as the `pushed_by_device_id` value.
Why: n/a.

### LKP-32 The join does not name a device; it means the last change came from a client persist, not central; ticks are unique so a match implies that device
Source: Part 2 01:27:38
Verdict: confirmed
Evidence: `persistIncomingChanges` stores `SyncDeviceTick{ deviceId, persistedAtSyncTick: tock }` (`CentralSyncManager.js:782`), `persisted_at_sync_tick` is the primary key (`000_baseline.sql:6374-6375`), and the persist transaction's own trigger writes stamp rows with the current clock value, which at that point is `tock`; the second tick-tock at `:787` moves the clock on so later writes do not match.
Why: comment `CentralSyncManager.js:784-786`.
Notes: the tick is central's tock, not any device-local tick (the transcript's clarification is right).

### LKP-33 The select stores `pushed_by_device_id` from `sync_device_ticks.device_id`; the lookup snapshot excludes rows pushed by the pulling device
Source: Part 2 01:29:10, 01:31:47
Verdict: confirmed
Evidence: write `updateLookupTable.js:50-52, 115`; read `snapshotOutgoingChanges.js:296-299`: `AND (pushed_by_device_id <> :deviceId OR pushed_by_device_id IS NULL)`, applied only when `avoidRepull && deviceId`.

### LKP-34 The locking clause comment (FOR KEY SHARE) and what it protects
Source: Part 2 01:29:10, 01:30:17
Verdict: confirmed
Evidence: `updateLookupTable.js:94-101` (quoted in Q8). The test `CentralSyncManager.updateLookupTable.test.js:1058-1129` pins the hard-delete case, including SQLSTATE `40001` on `error.cause`.
Why: the code comment itself.
Notes: the test does not pin the second half of the comment (an ordinary concurrent UPDATE is not a conflict).

### LKP-35 One thing to check: a record changed in the same transaction it is persisted in (the merge case) needs a different tick
Source: Part 2 01:31:47
Verdict: partly
Evidence: `incomingSyncHook` changes are marked `requiresRepull` (`packages/database/src/sync/incomingSyncHook.ts:57-78`) and re-stamped after the persist transaction by `bumpSyncTickForRepull` (`packages/database/src/sync/bumpSyncTickForRepull.ts:20-55`, `UPDATE ... SET updated_at_sync_tick = 1`, which the trigger rewrites to the current tick). Only `Patient` and `AppointmentSchedule` define `incomingSyncHook`. `adjustDataPostSyncPush` also runs after the transaction (`CentralSyncManager.js:790`). A field-wise merge (`saveUpdates` -> `mergeRecord`, `packages/database/src/sync/saveChanges.ts:46-60`, `mergeRecord.ts:19-45`) happens inside the persist transaction, is stamped with `tock`, and nothing sets `requires_repull` for it.
Why: the comment on `bumpSyncTickForRepull` (`:14-16`) names "field-wise merge of patient additional data records" as a case that requires a repull, but `requiresRepull` is only ever set in `incomingSyncHook.ts`; `patient_additional_data` has no `incomingSyncHook`.
Notes: possible gap, `inference`, not tested. Under the pre-lookup path, `removeEchoedChanges` kept a merged record because `updated_at_by_field_sum` differed (`removeEchoedChanges.ts:20-22`). Under the lookup path with `avoidRepull`, the merged `patient_additional_data` row would carry the pusher's device id and be excluded from that device's pull, so the pusher might not receive other devices' newer field values until the record changes again. No test pins either outcome. Worth a developer confirming before documenting avoid-repull as "safe".

### LKP-36 The refresher task is called SyncLookupRefresher and calls `updateLookupTable` every 20 seconds by default (a setting)
Source: Part 3 00:14:01
Verdict: confirmed (interval detail corrected in LKP-05 and Q1)

### LKP-37 The outer part tracks its own ticks; the build runs repeatable read so it works from a coherent snapshot; clients are one step behind
Source: Part 3 00:15:57, 00:17:12
Verdict: confirmed, clients nuance in LKP-11
Evidence: `CentralSyncManager.js:339-348, 350`; `repeatableReadTransaction` is `packages/database/src/sync/transactions.ts:21-34`, which runs `SELECT 1` straight away so the snapshot is pinned at transaction start (`:9-12`). The cursor is the `lastSuccessfulLookupTableUpdate` fact.
Why: comments `:336-338`.

### LKP-38 During the initial build, pending records need no update because source ticks are used; reason unknown
Source: Part 3 00:17:12, 00:21:51
Verdict: confirmed (mechanism); reason `inference`
Evidence: `CentralSyncManager.js:353-357, 373-380`: initial build passes `syncLookupTick = null`, which `COALESCE(:updatedAtSyncTick, table.updated_at_sync_tick)` turns into the source tick (`buildSyncLookupSelect.ts:21-28`); no T2 hook is registered and `SyncLookupTick(-1, currentTick)` is written inside T1 (`:354-357`). Test: `CentralSyncManager.syncLookup.test.js:912-928`.
Why: `inference`: syncs are refused until the first build finishes (LKP-39b), so no client can have pulled past the lookup yet. Stamping with the source ticks therefore preserves each record's true change history, so on a new central or a rebuilt table, facilities that already have the data do not all re-pull it (consistent with `buildSyncLookupSelect.ts:14-16`). The comment at `:351-352` only says it "uses ticks from the actual tables".

### LKP-39b Syncs are refused until the first build completes
Source: Part 3 00:17:12 (implicit; the task asked for the check location)
Verdict: confirmed
Evidence: `CentralSyncManager.js:186-193`: in `prepareSession`, `if (config.sync.lookupTable.enabled && isNil(syncLookupUpToTick)) throw new Error('Sync lookup table has not yet built. Cannot initiate sync.')`. The throw is caught at `:206-209` and written to the session as an error, so the client sees it by polling, not as an HTTP failure. Test: `CentralSyncManager.startSession.test.js:145-157`.
Notes: the check is on the fact being null. `get() || -1` in the build (`:343-344`) means a stored `-1` is treated as "initial" by the build but is *not* null for this check; tests set `-1` deliberately (`CentralSyncManager.syncLookup.test.js:913`). In production the fact is first written by the end of the first build (`:414`), so the first build is atomic with the guard lifting.

### LKP-39 After the commit, a second transaction tick-tocks and runs `updateSyncLookupPendingRecords`, and writes info mapping source ticks to lookup ticks
Source: Part 3 00:17:12
Verdict: confirmed
Evidence: `CentralSyncManager.js:359-370` (quoted in Q4). The mapping is a `SyncLookupTick{ sourceStartTick: previouslyUpToTick, lookupEndTick }` row. First written for the initial build inside T1, for incremental builds inside T2 (`#7562`, 2025-05-15). Consumed by `getLookupSourceTickRange.js:13-40` to bound which changelog entries to attach to a pull.
Notes: see LKP-63 for a naming trap (`maxSourceTick` is a lookup end tick).

### LKP-40 `updateSyncLookupPendingRecords` uses a pending tick, the flag -2; rows are tagged with -2 when written and retagged later
Source: Part 3 00:19:04
Verdict: confirmed
Evidence: flag defined `packages/database/src/sync/constants.ts:15-20` (`LOOKUP_PENDING_UPDATE: -2`). Written as the `:updatedAtSyncTick` value by the build (`CentralSyncManager.js:378-380`), retagged by `updateLookupTable.js:507-521`. Nothing else writes -2 (only references: `CentralSyncManager.js:380`, `updateLookupTable.js:517`, constants).
Why: PR #6167 originally used the flag `-1` (`SYNC_LOOKUP_PENDING_UPDATE_FLAG`); `#7562` introduced `SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE: -2`. No stated reason; `inference` that -1 collides with `INCOMING_FROM_CENTRAL_SERVER: -1` and with the initial pull's `since = -1`.
Notes: the old constant `SYNC_LOOKUP_PENDING_UPDATE_FLAG = -1` is still exported (`constants.ts:13`) and only mentioned in comments (`CentralSyncManager.js:375`, `buildSyncLookupSelect.ts:18`). It is stale and misleading.

### LKP-41 Between the two transactions a pull sees -2 rows but ignores them; an initial pull still ignores them because -2 < -1
Source: Part 3 00:19:04, 00:20:36
Verdict: confirmed
Evidence: reader predicate `updated_at_sync_tick > :since` (`snapshotOutgoingChanges.js:259`), with `since >= -1`.
Notes: rows are invisible to everyone until T1 commits; they are visible-but-ignored only in the window between T1 commit and T2 commit (Q3).

### LKP-42 The -2 mechanism exists so sync sessions can keep reading without being blocked while a long write is happening
Source: Part 3 00:21:51, 00:22:58, 00:27:43
Verdict: partly (see Drift LKP-46)
Evidence: comment `CentralSyncManager.js:373-377` "avoiding sync sessions missing records while sync lookup is being refreshed". Reasoning from the code: if the build stamped rows with a real tick at write time, the stamp (taken at the start) would be older than commit time. A pull that ticked the clock after the stamp and snapshotted before the commit would move its `since` past the stamp and never see the rows. To prevent that without a flag, the build would hold the clock row lock for the whole build, blocking every pull's tick-tock (`CentralSyncManager.js:196, 467`) for that long. The flag keeps the long work lock-free and shrinks the locked section to T2.
Why: `inference` from comments at `:373-377` and the importer's equivalent comment at `importerEndpoint.js:91-98` ("no sync pull snapshot can start while this import is still in progress").

### LKP-43 Could lowering the isolation level to read committed achieve the same?
Source: Part 3 00:22:58 to 00:27:43
Verdict: answered, see below
Evidence and answer: T1 is repeatable read for *snapshot coherence across models* (FK-consistent reads, `:350` and `transactions.ts:21-34`), not for the pending-flag problem; read committed in T1 would let later models see newer parents and not fix the stamping problem. For readers, `setupSnapshotForPull` itself runs in repeatable read (`CentralSyncManager.js:566-632`), so "readers are on read committed" is wrong for pulls. Reads of tick values (`SELECT value FROM local_system_facts`, in triggers) are plain read committed statements and never block. Phantom behaviour claims (repeatable read in Postgres does not allow phantom reads) are PostgreSQL documentation, not checked in code.

### LKP-44 T2 is the transaction whose comment says "any writes to current sync tick will have to wait until this transaction is committed"
Source: Part 3 00:29:01 to 00:36:17
Verdict: see Q4; the transcript's premise is wrong, the conclusion left open

### LKP-45 The sync lookup table has no triggers; null tick takes the source tick
Source: Part 3 00:31:55, 00:33:31
Verdict: confirmed
Evidence: `sync_lookup`, `sync_lookup_ticks`, `sync_device_ticks` are all in `NON_SYNCING_TABLES` (`packages/database/src/services/migrations/constants.ts:26-28`), so no sync-tick, updated-at or changelog trigger is installed; the baseline defines no trigger on them (`000_baseline.sql` has only the two lookup indexes on `sync_lookup`). The flag/delete triggers are installed on source tables, not on `sync_lookup`. Null -> source tick: `buildSyncLookupSelect.ts:22-23`.

### LKP-46 Self-heal is recent work; it exists because data can change without the tick changing (migrations)
Source: Part 3 00:36:17, 00:37:24
Verdict: confirmed
Evidence: PR #10485 (2026-07-30, "TAM-6930: sync_lookup self healing behaviour"). Comments at `updateLookupTable.js:289-293` match the transcript's reading.

### LKP-47 `needs_rebuild` is a real column set false on update and defaulting false; the migration adds a column and an index
Source: Part 3 00:38:57
Verdict: confirmed
Evidence: `1784601991763-addNeedsRebuildToSyncLookup.ts:5-22` also relaxes `data` to nullable and creates the partial index `sync_lookup_needs_rebuild_index ON sync_lookup (record_type) WHERE needs_rebuild`. Upsert sets `needs_rebuild = false` (`updateLookupTable.js:116`) and the insert supplies `false` (`:64`). Model default: `SyncLookup.ts:39`.

### LKP-48 `flag_for_rebuild_in_sync_lookup` can be called directly; on conflict it sets true; the hard-delete function is the after-delete trigger
Source: Part 3 00:38:57, 00:40:49
Verdict: confirmed
Evidence: `1784602019354-flagSyncLookupForRebuildOnDisabledTrigger.ts:17-42` (stub row `data NULL`, tick 0, `is_lab_request` false, `is_deleted` false, `needs_rebuild` true; `ON CONFLICT (record_id, record_type) DO UPDATE SET needs_rebuild = true`). Hard delete function `1784602090407-addSyncLookupHardDeleteTrigger.ts:15-23`.
Notes: `PR #10485`'s body says the delete trigger "deletes the matching lookup row directly" and names the function `remove_from_sync_lookup_on_hard_delete`; the code flags instead and the function is `flag_sync_lookup_for_rebuild_on_hard_delete`. The PR body is stale; the migration comment (`:3-12`) and the spec are right.

### LKP-49 A separate "disabled flag" trigger is added to tables; the latest migration moves flagging to an AFTER trigger and the previous one is identical
Source: Part 3 00:40:49, 00:42:34, 00:44:04
Verdict: confirmed
Evidence: latest: `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts`; previous definition of `set_updated_at_sync_tick`: `1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts`. A diff of the two function bodies shows only whitespace differences. The intermediate version, `1784602019354`, added flagging inside the BEFORE trigger (`TG_ARGV[0]`); `1793235590139` removes it again.
Why: PR #11659 (2026-11-12) body: the BEFORE ROW trigger sees NULL for stored generated columns; `translated_strings.id` is generated, so a stub got a NULL `record_id` and a migration failed. Hence a separate AFTER INSERT OR UPDATE trigger where the generated `id` is populated. The identical `set_updated_at_sync_tick` redefinition is explained at `:12-19` of the migration only partly (it must be idempotent for databases that applied `1784602019354`, and re-created so a database already past the earlier timestamp converges; PR #11662 re-timestamped it).

### LKP-50 When the sync trigger is disabled the AFTER trigger sets `needs_rebuild`; also on hard delete
Source: Part 3 00:45:23
Verdict: confirmed (see Q9)

### LKP-51 Trigger functions get attached by post-migration hooks; a migration calling an imported function is an anti-pattern
Source: Part 3 00:45:23, 00:46:44
Verdict: confirmed (fact); opinion unverifiable
Evidence: hooks `addOrReplaceSyncLookupDisabledFlagTrigger` (`postMigrationHooks.ts:112-158`) and `addSyncLookupDeleteTrigger` (`:160-188`), list at `:286-295`. `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:3, 70` does import and call the hook inside a migration, with the reason at `:12-14` (the hook only runs after the whole batch, so a later migration in the same batch would not be flagged).

### LKP-52 The heal pass finds rows with `needs_rebuild` and runs the same upsert with a set of record ids
Source: Part 3 00:46:44
Verdict: confirmed
Evidence: `updateLookupTable.js:294-359`, `:471-505`.

### LKP-53 The lookup-up-to fact is set from the raw tables after waiting for pending edits; a hard delete racing the build logs quietly and self-heals
Source: Part 3 00:48:23
Verdict: confirmed, with a caveat on what is "quiet"
Evidence: fact written at `CentralSyncManager.js:414` with `currentTick`; the wait that makes `currentTick` safe is `:341`. Logging: `:416-421` logs `warn` when `isConcurrentHardDeleteConflict(error)`, else `error`. That classifier matches **any** SQLSTATE `40001` anywhere in the cause chain (`updateLookupTable.js:10-16`), not only hard deletes, so other serialization failures log at warn with the "hard deleted" message (`:21-22`, `:417-421`).

### LKP-63 Naming trap, `SyncLookupTick` columns
Source: Part 3 00:17:12 (context)
Verdict: not a transcript claim; recorded for accuracy
Evidence: `getLookupSourceTickRange.js:37-40` returns `maxSourceTick: lastLookupTick.lookupEndTick`. The "max source tick" is the last *lookup end tick* (a clock value after the source cut-off), not the last source tick.
Why: `inference`: changelog rows are bounded by `record_sync_tick` against that range; using the end tick is inclusive of everything the lookup covered.

## Open questions answered

- **Why does the initial build use source ticks instead of the pending flag? (Part 3 00:17:12, 00:21:51)** Mechanism: `null` is passed and `COALESCE` selects the source tick (`buildSyncLookupSelect.ts:22-23`). The code comment only restates the mechanism. Reason is `inference` (LKP-38): nothing can have pulled yet (guard at `CentralSyncManager.js:188-193`), and source ticks preserve history so existing facilities do not re-pull.
- **Is there a gap where rows sit at -2? (Part 3 00:19:04)** Yes, between T1 commit and T2 commit, and it is harmless to pulls: -2 is below any `since` (>= -1). Before T1 commits the rows are not visible at all (uncommitted).
- **Does the "any writes to current sync tick will have to wait" comment hold? (Part 3 00:29:01)** See Q4: the tick-tock `UPDATE` does run inside T2 and does hold the row lock until commit.
- **Does the sync lookup table have triggers? (Part 3 00:31:55)** No.
- **Why not a materialised view? (Part 1 00:52:15)** Not documented anywhere; see Q12.
- **Why `shouldRebuildModel` not `since = -1`? (Part 2 01:23:10)** LKP-27.
- **Do model timings cancel builds? (Part 2 01:16:21)** No, LKP-20.
- **Why are patients flagged? (Part 2 01:21:34)** Merge fix, PR #10862, LKP-26.
- **Why does `set_updated_at_sync_tick` get redefined identically? (Part 3 00:40:49, 00:42:34)** LKP-49.
- **Is the merge case on a different tick? (Part 2 01:31:47)** LKP-35: only for hook-changed models, a gap otherwise.
- **How does sensitive network id get populated? (Part 2 01:13:26)** Q6.
- **Is avoid-repull in settings? (Part 2 01:26:13)** No, config file, LKP-30.

## Not in the transcript

### Q1. The refresher

- Task `SyncLookupRefresher` (`SyncLookupRefresher.js:4-8`), class registered `tasks/index.js:75`; `run()` is `await this.context.centralSyncManager.updateLookupTable()` (`:19-21`).
- Schedule: setting `schedules.syncLookupRefresher.schedule`, default `*/20 * * * * *` (every 20 seconds at seconds 0, 20, 40; cron with a seconds field), `enabled` default true, `jitterTime` default null (`packages/settings/src/schema/central.ts:935`; `packages/settings/src/schema/definitions/scheduledTask.ts:21-51`). The schedules are read once at task-runner startup (`tasks/index.js:44-46`: "schedule changes apply on server restart"). The same schedule and `enabled` also appear in `config/default.json5:263-266`; the settings value is the one read.
- Overlap within one process: prevented. `ScheduledTask.runImmediatelyImplementation` skips with "previous task still running" if `isRunning` (`packages/shared/src/tasks/ScheduledTask.js:104-113`), and claims it before the first await (`:115`).
- Overlap across processes: not prevented by the task. `isRunning` is in memory. `ScheduledTaskState.startRun` (`packages/database/src/models/ScheduledTaskState.ts:127-146`) only checks the "scheduled tasks held" fact and upserts a running record; it does not refuse a second runner. No advisory lock is taken in `updateLookupTable`. Two concurrent builds would both be repeatable-read; they upsert the same `sync_lookup` rows and both update the `lastSuccessfulLookupTableUpdate` fact row, so whichever commits second should hit SQLSTATE `40001` and roll back whole (`inference` from Postgres repeatable-read semantics, not tested). That failure would then log at warn with the "hard deleted" message (LKP-53). In practice one tasks process is expected; nothing enforces it.
- On error: `updateLookupTable` logs and rethrows after recording the error in the debug log (`CentralSyncManager.js:416-433`). `ScheduledTask` catches it, logs "Failed" and returns false (`ScheduledTask.js:177-190`). There is no backoff; the next cron fire (20 s) retries. T1 rolled back wholly so the cursor does not advance. If the *after-commit hook* (T2) throws, T1 has already committed: `Transaction.commit()` awaits hooks in its `finally` (`sequelize/lib/transaction.js:40-55` in 6.37.3), so the error reaches the same catch, the cursor and the -2 rows are already committed, and the next successful T2 will retag them (its `UPDATE ... WHERE tick = -2` is not scoped to its own build). That run's `sync_lookup_ticks` row would be missing (`inference`).
- Other callers of `updateLookupTable`: the `upgrade` and `rebuildSyncLookup` subcommands via `assertSyncLookupTableIsConsistent`.

### Q2. Outer structure of `CentralSyncManager.updateLookupTable` (`packages/central-server/app/sync/CentralSyncManager.js:325-434`)

1. `:328-333` create a `DebugLog` row of type `SYNC_LOOKUP_UPDATE` (autocommit).
2. `:335-339` tick-tock #1, `{ tick: currentTick }` (the "tick" half; the "tock" is discarded). Autocommit `UPDATE` on the clock row, no enclosing transaction, so the row lock is released immediately.
3. `:341` `waitForPendingEdits(currentTick)` (`:436-447`): reads `pg_locks` for advisory `ShareLock`s (`getSyncTicksOfPendingEdits.ts:10-18`), keeps those with tick `< currentTick`, and takes then releases `pg_advisory_xact_lock(t)` for each in autocommit (`waitForPendingEditsUsingSyncTick.ts:6-14`). Uses `currentTick`, the tick half.
4. `:343-348` read `lastSuccessfulLookupTableUpdate` (default `-1`), record `since` in debug log, compute `isInitialBuildOfLookupTable`. Autocommit.
5. `:350-415` T1: `repeatableReadTransaction` (`transactions.ts:21-34`), isolation REPEATABLE READ, `SELECT 1` at start to pin the snapshot.
   - `:353-371` initial build: create `SyncLookupTick(-1, currentTick)` in T1. Incremental: register the after-commit hook (T2, `:359-370`).
   - `:378-380` choose `syncLookupTick`: `null` (initial) or `-2`.
   - `:382-389` call `updateLookupTable` (`updateLookupTable.js:361-469`): read flagged patients and cap (`:386-390`), per-model loop (`:392-428`), patient rebuild pass (`:430-460`), write debug info (`:462`).
   - `:391-396` if any patients were rebuilt, register an after-commit hook to remove just those ids from the flag fact.
   - `:398-406` heal pass `healFlaggedLookupRows` (`updateLookupTable.js:471-505`), same transaction.
   - `:414` write `lastSuccessfulLookupTableUpdate = currentTick`, same transaction.
6. `:415` T1 commits. After-commit hooks run in registration order inside `commit()`: first T2's hook (incremental only), then the patient-flag cleanup.
7. T2 (`:359-370`): `store.sequelize.transaction(async () => {...})`, no isolation option, so Postgres default read committed (no global `isolationLevel` is set anywhere in `packages/database/src/services/database.js`). Steps: tick-tock #2 (`lookupEndTick`), `updateSyncLookupPendingRecords`, `SyncLookupTick.create({ sourceStartTick: previouslyUpToTick, lookupEndTick })`. Commits together.
8. `:416-433` catch (log, debug-log, rethrow) and finally (stamp `completedAt`).

Transaction summary: T1 repeatable read (incremental, patient, heal, up-to fact and, on initial builds, the tick row); T2 read committed. Steps 1-4 and the up-to fact read are autocommit read committed.

### Q3. The pending flag, why, and what a pull sees

Comments (all in `CentralSyncManager.js`):
```
351	        // do not need to update pending records when it is initial build
352	        // because it uses ticks from the actual tables for updated_at_sync_tick
...
373	        // When it is initial build of sync lookup table, by setting it to null,
374	        // it will get the updated_at_sync_tick from the actual tables.
375	        // Otherwise, update it to SYNC_LOOKUP_PENDING_UPDATE_FLAG so that
376	        // it can update the flagged ones post transaction commit to the latest sync tick,
377	        // avoiding sync sessions missing records while sync lookup is being refreshed
```
Why: LKP-42. In short, rows must carry a tick later than any pull tick already handed out, but a long build cannot know its commit time up front.
What a concurrent pull sees:
- Before T1 commits: nothing (uncommitted; the pull's own snapshot is repeatable read, `:571`).
- After T1 commits, before T2 commits: the rows exist with tick `-2`. The read predicate `updated_at_sync_tick > :since` (`snapshotOutgoingChanges.js:259`) with `since >= -1` excludes them. They are also excluded from the pull's `getLookupSourceTickRange` mapping, because the tick row only commits in T2.
- After T2 commits: rows carry tick `L` (T2's tick-tock tick), and are included by any pull whose `since < L`.
A pull's tick is its own tick-tock (`:467`).

### Q4. The T2 code, in full, and the lock facts

`CentralSyncManager.js:359-370` (the registration; runs inside `commit()` of T1):
```
359	          transaction.afterCommit(async () => {
360	            // Wrap inside transaction so that any writes to currentSyncTick
361	            // will have to wait until this transaction is committed
362	            await store.sequelize.transaction(async () => {
363	              const { tick: lookupEndTick } = await this.tickTockGlobalClock();
364	              await updateSyncLookupPendingRecords(store, lookupEndTick);
365	              await this.store.models.SyncLookupTick.create({
366	                sourceStartTick: previouslyUpToTick,
367	                lookupEndTick: lookupEndTick,
368	              });
369	            });
370	          });
```
`packages/central-server/app/sync/updateLookupTable.js:507-521`:
```
507	export const updateSyncLookupPendingRecords = withConfig(async (store, currentTick) => {
508	  await store.sequelize.query(
509	    `
510	      UPDATE sync_lookup
511	      SET updated_at_sync_tick = :currentTick
512	      WHERE updated_at_sync_tick = :pendingTick;
513	    `,
514	    {
515	      replacements: {
516	        currentTick,
517	        pendingTick: SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE,
518	      },
519	    },
520	  );
521	});
```
`CentralSyncManager.js:127-134`:
```
127	  async tickTockGlobalClock() {
128	    // rather than just incrementing by one tick, we "tick, tock" the clock so we guarantee the
129	    // "tick" part to be unique to the requesting client, and any changes made directly on the
130	    // central server will be recorded as updated at the "tock", avoiding any direct changes
131	    // (e.g. imports) being missed by a client that is at the same sync tick
132	    const tock = await this.store.models.LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);
133	    return { tick: tock - 1, tock };
134	  }
```
and `packages/database/src/models/LocalSystemFact.ts:83-103` (the statement that does the work):
```
83	  static async incrementValue(key: FactName, amount: number = 1): Promise<number> {
84	    const [rowsAffected] = await this.sequelize.query(
85	      `
86	        UPDATE
87	          local_system_facts
88	        SET
89	          value = value::integer + :amount,
90	          updated_at = NOW()
91	        WHERE
92	          key = :key
93	        RETURNING
94	          value;
95	      `,
96	      { replacements: { key, amount } },
97	    );
...
102	    return Number(fact.value);
103	  }
```

Facts:
- CLS config: `packages/database/src/services/database.js:32-40` calls `Sequelize.useCLS({ get, set, run })` over an `AsyncLocalStorage`; `run` creates a fresh `Map` per `transaction()` call (`:39`). `Sequelize.query` fills in `options.transaction` from `Sequelize._cls.get('transaction')` when the caller did not pass one (`sequelize/lib/sequelize.js:301-303`, 6.37.3). `incrementValue` and `updateSyncLookupPendingRecords` pass no `transaction`, and they are called with the same sequelize instance, so both inherit T2.
- Is the T2 callback inside its own CLS store? `sequelize.transaction(cb)` runs `Sequelize._clsRun` (a fresh `Map`) and `prepareEnvironment(true)` sets `transaction` in it (`sequelize.js:503-511`, `transaction.js:98-100`). So T2 is a new transaction, not T1 (which has already committed: `cleanup()` clears T1 from CLS, `transaction.js:55`, `:121-129`).
- Therefore the tick-tock `UPDATE local_system_facts ... WHERE key = 'currentSyncTick'` takes a row lock in T2 that is held until T2 commits (end of the callback). The importer takes the same lock on purpose (`importerEndpoint.js:91-103`, `FOR UPDATE`) for the stated reason that "the pull snapshot starts by updating the current time, so this locks that out".
- Every writer of the clock goes through that `UPDATE`: `tickTockGlobalClock` call sites `CentralSyncManager.js:196` (session start, autocommit), `:339` (lookup build, autocommit), `:363` (T2), `:467` (pull setup, autocommit, before the pull's repeatable-read transaction), `:763` and `:787` (persist; inside the persist transaction, so persist holds the lock for the whole persist), plus the importer's `FOR UPDATE`. A grep of `packages/` found no other central writer. (The facility has its own clock, `FacilitySyncManager.js:285-292`, irrelevant here.)
- Statements that read the current tick without writing it, none of which block on the row lock (plain MVCC read, they see the last committed value):
  - the sync-tick trigger `set_updated_at_sync_tick` on every source write (`1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:55-60`), which then takes a *try* shared advisory lock on that tick value;
  - the `updated_at_by_field` trigger functions (`000_baseline.sql:1129`, `:1154`);
  - the column default on `logs.migrations.record_sync_tick` (`:1694`) and the changelog trigger, similar;
  - `packages/upgrade/src/steps/1750625411304-bumpConfigurableConditionCategoryRecords.ts:17-25`.
  No pull reads the clock as an upper bound: the pull's `pullUntil` is the value returned from its own tick-tock, and the lookup read has no upper-bound predicate on `updated_at_sync_tick` (`snapshotOutgoingChanges.js:259`).
- Paths that *write* it and would therefore wait on T2's row lock until T2 commits: a pull's tick-tock at `:467`; `prepareSession`'s at `:196`; a persist's first tick-tock at `:763`; a second lookup build's at `:339`; the importer's `FOR UPDATE`.
- `setupSnapshotForPull`'s own tick-tock placement: it is at `:467`, **before** `repeatableReadTransaction` at `:571`; the pull's snapshot is therefore taken after its tick-tock returned. `waitForPendingEdits(tick)` runs at `:469` between them.

Possible interleavings (facts only; not a verdict). Let P be a pull's tick, L T2's lookup tick, "S" the pull's repeatable-read snapshot instant:
1. Pull tick-tock before T2's tick-tock (P < L), whenever S falls: the rows are either invisible (pre T2 commit) or visible, and are retagged to L > P either way; the pull's next `since = P` (via `pullUntil`) picks them up. No loss.
2. Pull tick-tock issued after T2's tick-tock but before T2 commits: that `UPDATE` waits on T2's row lock, so it returns only after T2 commits; S is after that. The rows are visible at S. No loss, provided that the pull's snapshot is after its own tick-tock (it is, by `:467` then `:571`).
3. Pull tick-tock between T1's commit and T2's start: the rows are -2 and ignored; `P < L`; picked up by the next pull as in 1.
4. A source write during T2: it stamps the last committed clock value (T2's increment is uncommitted). That value is below `L`, but the lookup's cursor is `currentTick` from step 2 of Q2, not `L`; those writes are handled by the next build, not by T2.
5. T2 fails after T1 committed: rows stay at -2 (ignored) until a later T2 retags them; a `sync_lookup_ticks` row is missing for that window.
6. The upper tick-tock at `:339` is autocommit, so T1's own start does not hold the lock.
What this analysis does not cover: Postgres re-evaluation of a blocked `UPDATE` after the lock releases (read committed re-reads the updated row, so a waiting tick-tock increments from the new committed value), and behaviour if `sequelize@6.37.8` differs from the 6.37.3 source read here. If the question is whether any interleaving still loses a row, a developer should re-check items 1 to 6 against 6.37.8.

### Q5. The initial build
See LKP-38 and LKP-39b. In addition: `previouslyUpToTick` is read with `|| -1` (`:343-344`), so "first build" means the fact is absent, null or `-1`. The first build also pulls every flagged model and patient normally. `lookupModelsToRebuild` seeded by the baseline (`000_baseline.sql:4740`) applies to it too (empty source tables on a new database).

### Q6. Per-model population

- `buildSyncLookupQueryDetails(sessionConfig)` is a static async method on each model returning `null`/`undefined` (meaning "syncs everywhere": `Patient.ts:350-352`, `SensitiveNetwork.ts:84`, `Facility.ts:119`) or `{ select?, joins?, where?, filter? }`. The build passes `sessionConfig = {}` (`updateLookupTable.js:378`), so the build never depends on a session; the lab and network decisions are read-time (`snapshotOutgoingChanges.js:259-300`).
  - `select`: a full SELECT list built by `buildSyncLookupSelect(model, { patientId, facilityId, sensitiveNetworkId, encounterId, isLabRequestValue })` (`buildSyncLookupSelect.ts:30-57`), column order `id, record_type, is_deleted, tick, device_id, data, patient_id, facility_id, sensitive_network_id, encounter_id, is_lab_request, updated_at_by_field_sum`. The builder appends `, false` for `needs_rebuild` (`updateLookupTable.js:63-64`). Defaults when a value is omitted: `NULL` for the ids, `FALSE` for `is_lab_request`, `NULL` for the field sum (except models with `updatedAtByField`).
  - `joins`: extra JOIN SQL appended after the tick and device joins.
  - `where`: replaces the default `table.updated_at_sync_tick > :since` for incremental builds only (`updateLookupTable.js:153-158`); ignored for full rebuild, heal and the patient pass. Example: `Encounter.ts:416-433`, which also includes encounters whose lab requests changed.
  - `filter`: ANDed onto every pass (`:91`), e.g. `settings.scope <> 'central'` (`Setting.ts:249-257`).
  - If no `select`, the default `buildSyncLookupSelect(model)` (all-null scope) is used (`:148`).
- `patient_id`: from the model's own `patient_id` via `buildPatientLinkedLookupFilter` (`packages/database/src/sync/buildPatientLinkedLookupFilter.ts:4-10`), or `encounters.patient_id` via `buildEncounterLinkedLookupSelect` (`buildEncounterLinkedLookupFilter.ts:8-17`), or a custom expression (`Note.ts`, `Prescription.ts:263-282` uses `COALESCE(encounters.patient_id, patient_ongoing_prescriptions.patient_id)`).
- `facility_id`: set only for facility-bound records: `patient_facilities`, `settings`, `reference_drug_facilities` use their own column; appointment-related models and location assignment models use `COALESCE(location_groups.facility_id, locations.facility_id)`.
- Sensitive network column: `facilities.sensitive_network_id`, reached encounter -> location -> facility, via `buildEncounterLinkedLookupJoins` (`buildEncounterLinkedLookupFilter.ts:19-29`, 47 models), `Notification.ts:63-79` (through `metadata->>'encounterId'`). A test pins that every encounter-linked model carries the column: `packages/database/__tests__/sync/syncLookupFacilityScope.test.ts:17-41` (title says "facility", asserts `sensitive_network_id`). Column added by `1789695736424-createSensitiveNetworks.ts:72-86` with a partial index. `facility_id` stays for genuinely facility-bound records, so a network-scoped row has `facility_id` null.
- `is_lab_request`: `TRUE` for `lab_requests`, `lab_tests`, `lab_test_panel_requests`, `lab_request_logs`, `lab_request_attachments`; for encounters it is `new_labs.encounter_id IS NOT NULL` where `new_labs` selects encounters with a lab request changed since `:since` (`Encounter.ts:416-433`), so it is true only on the build that sees the new lab request and is reset by any later rebuild of that encounter (`inference` from the overwrite, confirmed by test `CentralSyncManager.syncLookup.test.js:1453`).
- `encounter_id` column: never populated. No caller passes `encounterId`/`encounter_id` to `buildSyncLookupSelect` (grep of `packages/` finds only the column list and the `ON CONFLICT` assignment in `updateLookupTable.js:58, 110`). It is always NULL (`inference` from absence).
- The upsert: `INSERT INTO sync_lookup (...) <select> ... ON CONFLICT (record_id, record_type) DO UPDATE SET` overwrites `data`, `updated_at_sync_tick` (or keeps the existing value if `preserveExistingTick`, heal only), `is_lab_request`, `patient_id`, `encounter_id`, `facility_id`, `sensitive_network_id`, `updated_at_by_field_sum`, `is_deleted`, `pushed_by_device_id`, and resets `needs_rebuild = false` (`updateLookupTable.js:102-116`). It does not touch `id`, `record_id`, `record_type`.
- Soft deletes: `is_deleted = deleted_at IS NOT NULL` (`buildSyncLookupSelect.ts:42`).

### Q7. Pushed-by-device
Join, setting and read: LKP-31 to LKP-33. When `pushed_by_device_id` changes: it is recomputed on every upsert of the row from the source row's *current* `updated_at_sync_tick`. If a later change came from central (importer, tasks, adjust steps: tick not in `sync_device_ticks`) the join misses and the value becomes NULL; if another device persisted it, the value is that device. It is never cleared separately. The heal and patient passes recompute it too, so a healed row (tick preserved on the lookup row) keeps the attribution of the source row's tick. `sync_device_ticks` has one row per persist, no pruning code was found (`grep` for deletes over `packages/`). Reader behaviour when `deviceId` is falsy: the filter is skipped.

### Q8. Hard deletes
Clause and comment (`updateLookupTable.js:94-101`):
```
 94    -- Locks the source rows we're about to copy from, scoped to ${table} so the LEFT JOINs above
 95    -- aren't affected. Under REPEATABLE READ, if one of these rows was concurrently hard-deleted
 96    -- (committed after this transaction's snapshot was taken), Postgres raises a serialization
 97    -- failure here instead of letting us silently resurrect it in sync_lookup from stale data —
 98    -- the whole build aborts and retries on the next cycle, by which point the row is genuinely
 99    -- gone. FOR KEY SHARE (not FOR SHARE) so an ordinary concurrent UPDATE of these rows — the
100    -- common case — is not itself treated as a conflict.
101    FOR KEY SHARE OF ${table}
```
- Trigger: `AFTER DELETE ... FOR EACH ROW EXECUTE FUNCTION flag_sync_lookup_for_rebuild_on_hard_delete()` (`1784602090407:15-23`), installed per lookup-tracked table, central only, name `delete_<table>_from_sync_lookup`, by `addSyncLookupDeleteTrigger` (`postMigrationHooks.ts:160-188`); it fires during migrations too (it does not check `syncTrigger`).
- Effect: it calls `flag_for_rebuild_in_sync_lookup`, which sets `needs_rebuild = true` on the lookup row (or stubs one). The lookup row is not deleted by the trigger. The heal pass deletes it later, in the same transaction as the rest of the build: `DELETE FROM sync_lookup sl WHERE record_type = :recordType AND needs_rebuild AND NOT EXISTS (SELECT 1 FROM <table> t WHERE t.id::text = sl.record_id)` (`updateLookupTable.js:343-356`). Reason: the migration comment `1784602090407:3-12` (a direct delete could remove a parent row before a child's rebuild repointing it has been applied, so a snapshot in between could ship a child pointing at a missing parent).
- No tombstone is produced for a hard delete; the row simply stops being served (`inference` from the code; PR #10862 says the facility cascade-delete case is covered by a tombstone from the merge, not from this mechanism).
- Error handling: `isConcurrentHardDeleteConflict` (`:7-16`) matches SQLSTATE `40001` on `error.original`, `error.parent` or the `cause` chain. Per-model, patient and heal loops catch it, log at `warn`, and rethrow `Error(message, { cause })` (`:416-426`, `:442-447`, `:482-487`). The outer `catch` also logs warn (`CentralSyncManager.js:416-421`) and rethrows; the task layer logs "Failed" (LKP-53). The whole T1 rolls back.
- The same 40001 can also arise from the delete trigger's own write to the lookup row racing the build's upsert of that row (`inference`; classified identically).

### Q9. Rebuild flags and self-healing
- Column `needs_rebuild boolean NOT NULL DEFAULT false` plus partial index `sync_lookup_needs_rebuild_index (record_type) WHERE needs_rebuild` (`1784601991763`).
- Everything that sets `needs_rebuild = true`:
  1. `flag_for_rebuild_in_sync_lookup(record_type, record_id)` (`1784602019354:17-42`), the only function that writes it.
  2. The AFTER INSERT OR UPDATE trigger function `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()` (`1793235590139:22-33`), which calls (1) when the `syncTrigger` fact is `'disabled'` (the migrations' mode, also `disableSyncTrigger` helper `packages/database/src/dataMigrations/index.js:10-16`). Installed per lookup-tracked table, central only, name `flag_<table>_for_lookup_rebuild`, by `addOrReplaceSyncLookupDisabledFlagTrigger` (`postMigrationHooks.ts:112-158`), which also removes triggers no longer wanted (e.g. a database that moved from central to facility). Also installed by the migration itself so a later migration in the same batch is flagged.
  3. The hard-delete trigger (Q8).
  4. No migration or runtime code calls (1) directly (grep of `packages/` shows none outside tests).
- Other lookup rebuild state (not `needs_rebuild`): `flag_lookup_model_to_rebuild(model_name)` (baseline) appends a table name to the `lookupModelsToRebuild` fact; ~28 migrations call it. `flag_lookup_patients_to_rebuild(patient_ids)` (`1787615019000`) appends to `lookupPatientsToRebuild`; called from `mergePatient.js:480` and `PatientMergeMaintainer.js:134`, and seeded for already-merged patients by `1787615019001`.
- Clearing: the upsert resets `needs_rebuild = false`; heal deletes rows whose source is gone; `markLookupModelRebuilt` after the model's full rebuild (`updateLookupTable.js:411-413`, inside T1); `markLookupPatientsRebuilt` after commit for exactly the rebuilt ids (`CentralSyncManager.js:391-396`, so a patient flagged mid-build survives).
- Heal pass: per model, `WHERE table.id::text IN (SELECT record_id FROM sync_lookup WHERE record_type = :recordType AND needs_rebuild)` with `preserveExistingTick: true` (`updateLookupTable.js:294-341`): `updated_at_sync_tick = sync_lookup.updated_at_sync_tick` on conflict, so it does not move a healed row's tick and clients do not re-pull. Then the delete step. Test names pin this: `CentralSyncManager.updateLookupTable.test.js:855, 891, 922, 991, 1019`.
- Patient rebuild pass (`updateLookupTable.js:187-287`): for flagged patients, find record types with rows whose `patient_id` is in the batch, and rebuild each such row with the same upsert, **not** preserving the tick (new tick so facilities re-pull, comment `:187-190`). Cap `sync.maxFlaggedPatientsPerBuild`.
- Per-model full rebuild: `isLookupRebuildingModel` at `updateLookupTable.js:394-396`, `shouldFullyRebuild` selects `updated_at_sync_tick > -1` (`:155-158`), historic ticks kept for unchanged rows (`buildSyncLookupSelect.ts:21-28`), flag cleared afterward. Set by migrations (above), not by runtime code.
- `assertSyncLookupTableIsConsistent` (`packages/central-server/app/sync/assertSyncLookupTableIsConsistent.js:8-24`): builds a `CentralSyncManager`, calls `updateLookupTable()` (all passes, plus T2), then throws if `SELECT count(*) FROM sync_lookup WHERE needs_rebuild > 0`. Callers: `upgrade` subcommand (`upgrade.js:28-32`, skipped for `--dry-run`, exit 1 on failure) and `rebuildSyncLookup` subcommand (used by `.github/scripts/e2e-test-setup.sh`). The `just-migrate` subcommand (`migrate.js`) does not gate. There is no automated test of this wrapper (PR #10485 states the upgrade gate's CLI logic is untested). Spec text: `specs/sync/lookup-table.md` "Blocking upgrades until the lookup table is consistent".
- Stub rows (data null) are excluded from snapshots (`snapshotOutgoingChanges.js:260`).

### Q10. `registerSyncLookupUpdateListener`
`packages/central-server/app/sync/registerSyncLookupUpdateListener.js:10-18`: on the Postgres `table_changed` NOTIFY channel, when `payload.event === 'UPDATE'` and `payload.changedColumns` includes `patient_id`, it finds the model for `payload.table` and calls `refreshChildRecordsForSync(model, payload.newId)` (`packages/shared/src/utils/refreshChildRecordsForSync.js:14-48`). That raw `UPDATE <child> SET updated_at_sync_tick = 1 WHERE <fk> = :id` walks `HasMany`/`HasOne` associations (skipping `DO_NOT_SYNC`) recursively, relying on the sync tick trigger rewriting `1` to the current tick, so children re-enter the incremental build and their derived `patient_id` is recomputed. Registered in the central API process (`packages/central-server/app/createApp.js:20`), not the tasks process. NOTIFY triggers for it are installed on all non-excluded tables with a `patient_id` column (`postMigrationHooks.ts:211-217`; the comment at `:208` names this listener). Asynchronous and best effort: it is a NOTIFY listener (a missed notification during a disconnect is not replayed), and every API process receives the notification, so each runs the update (`inference`, idempotent). Test: `CentralSyncManager.syncLookup.test.js:1604-1730`. Note PR #10862 deleted a similar "child walk" in the merge path in favour of the flag (LKP-26); this listener remains for patient changes via ordinary updates.

### Q11. Schemas
`sync_lookup` (`000_baseline.sql:3979-3992` plus later migrations; model `SyncLookup.ts`):
| Column | Type | Purpose |
|---|---|---|
| `id` | bigint (sequence) | Row cursor used for paging the read (`id > :fromId ORDER BY id`) and as `sync_lookup_id` in the session snapshot |
| `record_id` | text (was varchar(255), `1780449878598`) | Source record id |
| `record_type` | varchar(255) | Source table name |
| `data` | json, nullable since `1784601991763` | Copy of the record; null for stub rows |
| `updated_at_sync_tick` | bigint | Lookup tick: -2 pending, source tick on initial build/full rebuild/heal, T2 tick otherwise |
| `patient_id`, `encounter_id`, `facility_id` | varchar(255) | Scope columns (`encounter_id` always null, see Q6) |
| `sensitive_network_id` | varchar(255), `1789695736424` | Network scope |
| `is_lab_request`, `is_deleted` | boolean | Lab and tombstone flags |
| `updated_at_by_field_sum` | bigint | Sum of per-field ticks, for `removeEchoedChanges` |
| `pushed_by_device_id` | text | Avoid-repull attribution |
| `needs_rebuild` | boolean not null default false | Self-heal flag |
Indexes: PK on `id`; unique `(record_id, record_type)` (`sync_lookup_record_id_record_type_uk`, the ON CONFLICT target); `sync_lookup_patient_id (patient_id)`; `sync_lookup_updated_at_sync_tick_record_id_patient_id_facility_ (updated_at_sync_tick, record_id, patient_id, facility_id)`; partial `sync_lookup_needs_rebuild_index (record_type) WHERE needs_rebuild`; partial `sync_lookup_sensitive_network_id_index (sensitive_network_id) WHERE sensitive_network_id IS NOT NULL`.
`sync_lookup_ticks` (`000_baseline.sql:4018-4022`; model `SyncLookupTick.ts`): `id bigint GENERATED ALWAYS AS (lookup_end_tick)`, `source_start_tick`, `lookup_end_tick` (PK). One row per build: maps a lookup tick range to the source ticks it covers, so `getLookupSourceTickRange.js:13-40` can bound which changelog rows to attach to a pull (introduced by PR #7562). Grows by one row per refresh (about every 20 s); the file's own comment notes it can be large enough to exhaust the heap if loaded whole.
`sync_device_ticks` (`000_baseline.sql:3968-3972`): `persisted_at_sync_tick` (PK), `device_id`; one row per persisted push.

### Q12. Why not a materialised view
No code comment, spec, PR body (checked #6167, #6407, #6545, #10485, #10862, #11659), commit message or doc in this repository gives a reason, so the transcript's own "don't know" is the best statement available. Materialised views are used elsewhere (facility `RefreshMaterializedView` task and the upcoming-vaccinations view), so the technique was known. Code facts bearing on it (`inference`, not stated reasons): the lookup tick is *history dependent* state, not a function of the source (T2 stamps, heal preserves the existing tick, a full rebuild keeps older ticks, `pushed_by_device_id` and `needs_rebuild` are also state), and the build is chunked, per-model SQL inside one repeatable-read transaction with a post-commit retag. A plain `REFRESH MATERIALIZED VIEW` recomputes from source and could not carry that state.

### Other things a developer changing this area should know
- `validateSync` does not require `buildSyncLookupQueryDetails` (see LKP-04). A pull model without it throws `buildSyncLookupQueryDetails is not a function` at build time, caught and wrapped as "Failed to update X for lookup table" (`updateLookupTable.js:422-426`), which would fail every build.
- A `filter` returned by a model applies to every pass, so a source row that stops matching the filter keeps its stale lookup row (it is no longer selected for rebuild). Example: a setting changed to central scope after it was built (`inference`; the central-scope test at `syncLookup.test.js:1130` covers only a fresh build).
- Flag triggers read the `syncTrigger` fact on every insert/update of every lookup-tracked central table (`1793235590139:27`); PR #11659 notes the extra read.
- `debugObject.addInfo` (`DebugLog.ts:29-33`) calls `update`, which joins the current CLS transaction. Inside T1 it is lost on rollback; the code holds `modelTimings` unsaved for that reason (`updateLookupTable.js:382-384`).
- `getModelsForPull` (not the full model list) is the outgoing set for both build and heal (`CentralSyncManager.js:384, 403`).
- Sync directions other than pull-from-central/bidirectional make the whole build throw (`updateLookupTable.js:363-376`).
- `LocalSystemFact.markLookupModelRebuilt` and the patient clearing are plain `UPDATE`s on a fact row inside T1; a concurrent writer of the same row (a migration or a merge) makes T1 fail with 40001 under repeatable read, which is why patient clearing is deferred to after commit (comment at `updateLookupTable.js:465-466`).

## Unresolved

- Whether Q4's interleavings are all safe. The facts support that T2 holds the clock row lock; the remaining questions are about Postgres edge semantics and Sequelize 6.37.8 vs 6.37.3. Look at: `node_modules/sequelize/lib/transaction.js` after an `npm ci`, and a two-connection integration test that issues a tick-tock while T2 is open (none exists: grep of `packages/central-server/__tests__/sync/` for `afterCommit`/T2 behaviour finds nothing).
- Whether the field-wise-merge attribution gap (LKP-35) is real. Look at: a test that pushes a `patient_additional_data` edit from device A, a conflicting newer-field edit from device B, builds the lookup, and pulls as A with `avoidRepull` on.
- What actually prevents two refreshers running at once in a multi-process deployment. Look at: deployment manifests for the tasks runner (replica count), not in this repository.
- Behaviour of `FOR KEY SHARE` under repeatable read for a concurrent non-key UPDATE (the comment's second claim). It is PostgreSQL semantics; no test pins it. Look at: a repeatable-read test updating a non-key column while the build locks the row.
- Why the pending flag was moved from -1 to -2 (#7562). Look at: that PR's discussion.
