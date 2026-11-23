# Legacy pull snapshot built from models

Nobody needs this document to work on sync as it runs today. It describes the path central used to build a pull snapshot before the `sync_lookup` table existed. That path is not used in production and is due to be deleted. It is written down once, here, so that the understanding outlives the code and the main sync overview does not have to explain it.

Read it when:

- a central sync test behaves in a way the lookup table does not explain, because the test config runs on this path
- you are removing the path and need to know which pieces something else still depends on
- a model declares `buildSyncFilter` or `buildPatientSyncFilter` and nothing in the lookup build seems to use it

The path is selected by the central config key `sync.lookupTable.enabled`. It defaults to true, so the path runs only where the key is set to false. The central test config sets it to false. The dispatch is in `snapshotOutgoingChanges` in `packages/central-server/app/sync/snapshotOutgoingChanges.js`, which calls either `snapshotOutgoingChangesFromSyncLookup` or `snapshotOutgoingChangesFromModels`.

## How a snapshot was built from models

`snapshotOutgoingChangesFromModels` receives the models to pull, the `since` tick, a patient count, the name of a session table of marked patients, the session id, the facility ids and the session config. It does three things.

1. It rejects any model whose sync direction is not `BIDIRECTIONAL` or `PULL_FROM_CENTRAL`, before doing any work.
2. It loops over the models one at a time, calling `snapshotChangesForModel` for each and adding up the counts. A failure is rethrown with the model name.
3. It returns the total.

The same function is called up to three times per session from `setupSnapshotForPull` in `CentralSyncManager.js`, once per pass:

- Newly marked patients are pulled from the beginning of time (`since` of -1). This pass uses only the patient-linked models, the table of patients marked since the last pull, and a session config reduced to the sensitive network.
- Everything else is pulled since the client's last pull. This pass uses the table of patients already marked.
- Tables a mobile client asks to resync in full are pulled from -1, using the same marked patients table as the regular pass.

All passes write into the one session snapshot table, which also holds the rows the client pushed.

### Choosing the filter

For each model, `snapshotChangesForModel` picks the filter as follows.

- If the model declares `buildPatientSyncFilter`, it is called with the patient count, the marked patients table and the session config. If it returns `null`, the model has nothing to send and the function returns 0 without running a query.
- Otherwise the model's `buildSyncFilter()` is used.

The patient count is the number of `patient_facilities` rows for the session's facilities in the regular pass, and the number of newly marked rows in the full pass. The `null` short-circuit therefore fires only when the facilities have no marked patients at all. A filter that returns an empty string is not `null`. It means no restriction, and falls through to the default where clause below.

### The query

Each model runs one `INSERT ... SELECT` into the snapshot table, wrapped in a CTE so the statement can return a cursor. The inserted row has:

- direction `outgoing`
- `is_deleted`, true when `deleted_at` is set
- `record_type` (the table name) and `record_id`
- `saved_at_sync_tick`, the row's own `updated_at_sync_tick`
- `updated_at_by_field_sum`, covered under echoes below
- `data`, a JSON object built with `json_build_object` from the model's attributes, minus the columns in `COLUMNS_EXCLUDED_FROM_SYNC` (`packages/database/src/sync/constants.ts`)

The where clause is the filter if there is one, otherwise `WHERE <table>.updated_at_sync_tick > :since`. A filter is therefore expected to contain its own `since` condition, and every builder below does.

Paging is by primary key. The statement adds `AND <table>.id > :fromId` after the first chunk, orders by `id`, limits to `sync.maxRecordsPerSnapshotChunk`, and returns the maximum inserted id and a count. The loop repeats until a chunk inserts nothing. The default chunk size is a billion, so in practice each model is a single statement.

The filter text is spliced into the query, and `facilityIds` and `since` are bound as replacements, so a filter may refer to `:since` and `:facilityIds`. This is why some filters mention parameters that this file never names.

## The filter a model declares

Every model that pulls from central must say which of its rows go to which facility. There are two hooks.

- `buildSyncFilter()` takes no arguments and returns a where clause, with any joins it needs, or `null`. It is for tables that are not tied to a patient.
- `buildPatientSyncFilter(patientCount, markedForSyncPatientsTable, sessionConfig)` is for tables reached through a patient. Declaring it marks the model as patient-linked, and it takes precedence over `buildSyncFilter`.

### Tables that sync everywhere

`Facility`, `ReferenceData`, `Patient`, `Location` and many others declare `buildSyncFilter` and return `null`, with a comment saying the table syncs everywhere. A null result takes the default where clause, so every row changed since `since` is sent. Patients themselves sync everywhere. It is their dependants that are scoped to marked patients.

Some tables are scoped to the session's facilities with a plain clause. `PatientFacility` uses `facility_id IN (:facilityIds)`, `ReferenceDrugFacility` the same, and `Setting` adds `OR scope = 'global'`. `LocationAssignment` joins `locations` and `location_groups` to find the facility.

### Why every syncing model must declare one

A new model could otherwise sync to everyone by accident, because "no filter" and "everything" would be the same thing. Requiring a declaration, even one that returns nothing, forces whoever writes the model to decide who should receive its rows. It is enforced at startup. `Model.validateSync` (`packages/database/src/models/Model.ts`), called from `init`, throws if a `BIDIRECTIONAL` or `PULL_FROM_CENTRAL` model has neither function, and the message says to return `null` if the table syncs everywhere. No test pins this. Push-only and do-not-sync models are exempt.

### Tables with a patient id

`buildPatientSyncFilterViaPatientId` (`packages/database/src/sync/`) is the generic builder for a table with a `patient_id` column. It returns `null` when the patient count is zero, and otherwise:

```sql
WHERE patient_id IN (SELECT patient_id FROM <marked table>) AND updated_at_sync_tick > :since
```

`PatientAdditionalData` uses it, as do the allergy, birth data, care plan and condition tables and others. The columns are unqualified, so it works only for a query with no joins.

### Tables reached through an encounter

`buildEncounterLinkedSyncFilter` takes a list of tables from the model's own table up to `encounters`, and the marked patients table. It joins them in the order given, each as `LEFT JOIN <next> ON <previous>.<column> = <next>.id`. The column defaults to the singular of the next table plus `_id`. An entry can instead be `{ model, joinColumn, required }` where the column is unconventional, and `required` makes the join an inner join. The where clause is that the encounter's patient is marked and the first table's tick is above `since`.

`ImagingRequest` passes its own table and `encounters`. `ImagingResult` is nested one level deeper and passes its table, `imaging_requests` and `encounters`. About three dozen models use this builder, including discharge, diagnosis, triage, vitals, tasks and the invoice tables. `buildEncounterLinkedSyncFilterJoins` is exported separately because the lookup build reuses it.

Some models write their joins by hand when a column does not follow the convention. `SurveyResponseAnswer` joins through `survey_responses.response_id`.

### Encounters

`Encounter.buildPatientSyncFilter` is bespoke because of sync-all-lab-requests. It collects the conditions for including an encounter. The encounter's patient is marked, or, with the setting on, the encounter has a lab request. Alongside them it collects tick conditions, either the encounter's own tick or the lab request's.

For the lab case it left-joins a subquery of encounters that have lab requests and have changed since `since`. The subquery groups by encounter id to deduplicate several lab requests on one encounter, takes the highest lab request tick, and excludes patients already in the marked table because those encounters sync anyway. It returns `null` if there is nothing to include, which means no marked patients and the setting off.

### Lab requests

`LabRequest.buildPatientSyncFilter` returns an empty string when sync-all-lab-requests is on, meaning every lab request since `since`. Otherwise it returns `null` for no marked patients, or the encounter-linked filter. `LabTest`, `LabTestPanelRequest` and `LabRequestAttachment` do the same.

### Notes

`buildNoteLinkedSyncFilter` handles `notes`, whose `record_id` can point at many tables. It left-joins every table a note can attach to, plus the encounter for the record types that reach their patient through one (`Triage`, `LabRequest`, `ImagingRequest`), then ORs together one condition per record type:

- a note on a patient whose patient is marked
- a note on a triage, lab request or imaging request whose encounter's patient is marked
- a note on any other record type whose own `patient_id` is marked

It returns `null` when there are no marked patients. The list of record types comes from `NOTE_RECORD_TYPE_VALUES` in `@tamanu/constants`, and a comment there says that adding a type means altering this builder. `Note.initRelations` and `getPatientIdColumnOfNotes` iterate the same list, so the joins follow a new type automatically, but the where conditions are built per record type and the comment is not tested.

## Sync-all-lab-requests on this path

The `sync.syncAllLabRequests` facility setting is resolved once per session into the session config. It is true if any of the session's facilities has it on, and false for mobile clients and for the initial sync (`since` of -1). The pass for newly marked patients never sees it.

With the flag on, this path sends every lab request changed since `since`, every lab test, panel request and attachment for them, and the encounters those lab requests belong to, whether or not the patient is marked.

It also sends every note on a lab request. `buildNoteLinkedSyncFilter` appends `notes.record_type = 'LabRequest'` to its ORs when the flag is set. The lookup path does not. There the lab flag is a column on the lookup row, notes are never flagged, and notes arrive only for marked patients. The two paths therefore return different note sets for the same facility.

## How echoes were removed

A session pushes and then pulls. On this path the pull reads the same tables the push just wrote to, so every record the client pushed would come straight back. `removeEchoedChanges` (`packages/database/src/sync/removeEchoedChanges.ts`) deletes those rows from the outgoing snapshot. It runs once, after all the snapshot passes, inside the snapshot transaction, and it is not conditional on the lookup flag.

It is a self-join on the session snapshot table, which holds incoming and outgoing rows together. An outgoing row is deleted when an incoming row for the same record type and id has:

- the same `saved_at_sync_tick`
- the same `updated_at_by_field_sum`, compared with `IS NOT DISTINCT FROM` so two nulls match

### The saved-at tick

The persist step stamps every incoming snapshot row with the tick the persist wrote at. The sync-tick trigger stamps the rows the persist writes with that same tick. When the outgoing snapshot reads those rows back, their `saved_at_sync_tick` equals the incoming row's, so they are recognised as unchanged since the push and removed. A row that was changed again afterwards has a different tick and is kept, which is the point of the first comparison: a change made outside the session between push and pull must still reach the client.

Persist uses two tick-tocks for this. The first, before writing, gives the persist a tick that no other write can share, since `tickTockGlobalClock` advances the clock by two and the persist keeps only the upper value (the tock). The second, before the transaction commits, moves the clock past that tick, so nothing written afterwards can reuse it. Post-push hooks such as `adjustDataPostSyncPush` and the repull bump run after the transaction for the same reason: their writes land on a later tick, so they survive echo removal and go back to the client. The same property later became what the lookup path's device attribution rests on, which is why neither tick-tock can be dropped.

### The field-sum check

The tick alone is not enough for a field-merged row. The merged row is saved at the persist tick, so its tick matches the incoming row, yet it may now hold field values that came from elsewhere. Removing it as an echo would leave the client with its pre-merge copy. `PatientAdditionalData` is the only model with an `updatedAtByField` column, a JSON map of field name to last-updated time.

To detect this, the snapshot stores `updated_at_by_field_sum`, the sum of the map's values. For incoming rows it is computed when they are added to the session. For outgoing rows from this path, `snapshotChangesForModel` joins a per-row subquery summing `json_each(updated_at_by_field)`, but only when the model has an `updatedAtByField` attribute. Other models store null on both sides, which still matches. If the merge changed any field, the sums differ, the row is kept and the client gets the merged version. The sum is a cheap checksum rather than an exact comparison.

### On the lookup path

The function still runs on the lookup path and cannot match anything there. Outgoing rows carry ticks stamped by the lookup build, which come from a different half of the tick-tock than the persist tick and can never equal it. Echoes on that path are avoided by excluding rows pushed by the same device (`pushed_by_device_id`), a mechanism added after the lookup table shipped.

## What this path lacks

This path predates several features, none of which were added to it.

- Sensitive network scoping. The session resolves a sensitive network and passes it in the session config, but no model filter reads it. Which records reach a facility is decided by the marked patients and the filters alone.
- Device attribution. The path does not take `deviceId`, so it cannot exclude records the device pushed. It relies on echo removal alone, which only works for records saved at the persist tick.
- The mobile exclusion of sensitive survey answers. `SurveyResponseAnswer.buildPatientSyncFilter` has a branch on `sessionConfig.isMobile`, but the session config built by `setupSnapshotForPull` never sets it, so the branch does not run.

Switching the lookup table off is therefore not a safe fallback for a deployment with sensitive networks, or any deployment relying on those behaviours.

## What still uses pieces of it

- The facility bootstrap. `buildFacilityBootstrap.js` calls `model.buildSyncFilter() ?? 'WHERE TRUE'` for nine models (`ReferenceData`, `SensitiveNetwork`, `Facility`, `User`, `UserFacility`, `Role`, `Permission`, `Setting`, `TranslatedString`) with `since` of -1, and reads the tables directly. This does not depend on the lookup flag and runs in production for any facility syncing from scratch.
- The patient-linked check. `getPatientLinkedModels` selects models by whether `buildPatientSyncFilter` exists. `setupSnapshotForPull` uses it to choose the models for the pass over newly marked patients, and the lookup query uses it to decide whether a patient clause applies. Only the existence of the function matters there, not its body.
- The lookup build. `buildEncounterLinkedSyncFilterJoins`, `getPatientIdColumnOfNotes` and `buildNoteLinkedJoins` are exported from the filter builder files and used by the lookup selects.
- Tests. `__tests__/utilities.js` sets `sync.lookupTable.enabled` to false in its default config, as does `config/test.json5`, so central sync tests run on this path unless a file turns the lookup table on. `snapshotOutgoingChanges.test.js` exercises it, including sync-all-lab-requests, and some tests build models with a stubbed `buildSyncFilter` returning null.

## What removing it would involve

Code that goes with the path:

- `snapshotChangesForModel`, `snapshotOutgoingChangesFromModels` and the dispatch in `snapshotOutgoingChanges`
- the `sync.lookupTable.enabled` key, its guard in `prepareSession` and the `useSyncLookup` session parameter
- `removeEchoedChanges` and its call in `setupSnapshotForPull`
- the SQL bodies of `buildPatientSyncFilter` on models, including the bespoke ones on `Encounter`, `LabRequest`, `LabTest`, `LabTestPanelRequest`, `LabRequestAttachment`, `SurveyResponseAnswer` and `Note`, with `buildPatientSyncFilterViaPatientId`, `buildEncounterLinkedSyncFilter` and the filter half of `buildNoteLinkedSyncFilter`
- the `syncAllLabRequests` and `isMobile` fields of the session config that only these filters read, and the `SessionConfig` type that declares them
- the model-path tests, and the config in test setup that selects the path

Code that has to stay because something else uses it:

- every `buildSyncFilter` that the facility bootstrap calls, on the nine bootstrap models
- the existence of `buildPatientSyncFilter`, or a replacement marker, for `getPatientLinkedModels`
- `buildEncounterLinkedSyncFilterJoins` and the note join and patient-id helpers, used by the lookup selects
- `Model.validateSync`, which enforces the declaration for every syncing model, and which would have to be reworded if the declaration it asks for changes
- `updated_at_by_field_sum` on the snapshot table, which the lookup path also fills, and the persist step's two tick-tocks
