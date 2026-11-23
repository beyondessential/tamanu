# The retired model-snapshot path

Before the `sync_lookup` table existed, central built each pull by querying every model's own table, using a filter the model declared. That path is still in the code. It is not used in production and is due to be deleted.

It is written down here, once, so that the understanding outlives the code and the [sync overview](overview.md) does not have to explain it. You do not need this document to work on sync as it runs today. Come here when:

- a central sync test behaves in a way the lookup table does not explain, because the test config runs on this path
- you are removing the path and need to know what else depends on pieces of it
- a model declares `buildSyncFilter` or `buildPatientSyncFilter` and nothing in the lookup build seems to use it

The path is chosen by the central config key `sync.lookupTable.enabled`, which defaults to true. Setting it to false selects this path. The choice is made in `snapshotOutgoingChanges` in `packages/central-server/app/sync/snapshotOutgoingChanges.js`, which calls either `snapshotOutgoingChangesFromSyncLookup` or `snapshotOutgoingChangesFromModels`.

## How a snapshot is built from models

`snapshotOutgoingChangesFromModels` rejects any model that does not pull from central, then loops over the models one at a time, calling `snapshotChangesForModel` for each.

`setupSnapshotForPull` in `CentralSyncManager.js` calls it up to three times per session, exactly as it does for the lookup path:

- for patients newly marked for sync, from the beginning of time, over the patient-linked models only
- for everything else, since the client's last pull
- for any tables a mobile client asked to resync from scratch

All passes write into the session's one snapshot table, which also holds the rows the client pushed.

### Choosing the filter

For each model, `snapshotChangesForModel` asks the model who should receive its rows.

- If the model declares `buildPatientSyncFilter`, that is called with the number of patients in this pass, the name of the session's table of marked patients, and the session config. A `null` result means there is nothing to send, and no query runs.
- Otherwise the model's `buildSyncFilter()` is called.

The `null` short-circuit matters most in the pass for newly marked patients, where the count is usually zero and every patient-linked model is skipped without touching the database. In the regular pass it fires only for a facility with no marked patients at all.

An empty string is not `null`. It means "no restriction", and the query falls back to its default where clause.

### The query

Each model runs an `INSERT ... SELECT` into the snapshot table. The row it inserts has:

- direction `outgoing`
- `is_deleted`, true when `deleted_at` is set
- `record_type` (the table name) and `record_id`
- `saved_at_sync_tick`, the source row's own `updated_at_sync_tick`
- `updated_at_by_field_sum`, explained under [How echoes are removed](#how-echoes-are-removed)
- `data`, the record as JSON, built from the model's attributes without the columns in `COLUMNS_EXCLUDED_FROM_SYNC`

The where clause is the model's filter if it gave one, and otherwise `WHERE <table>.updated_at_sync_tick > :since`. A filter replaces the default entirely, so every filter has to carry its own `since` condition, and every builder below does.

The filter is spliced into the query as text, with `:since` and `:facilityIds` bound as parameters. That is why some model filters mention `:facilityIds` without anything nearby appearing to supply it.

Rows are paged by `id` in chunks of `sync.maxRecordsPerSnapshotChunk`. The default is a billion, so in practice each model is one statement.

## The filter a model declares

Every model that pulls from central has to say which of its rows go to which client. There are two methods.

- `buildSyncFilter()` takes no arguments and returns a where clause, with any joins it needs, or `null`. It is for tables not tied to a patient.
- `buildPatientSyncFilter(patientCount, markedForSyncPatientsTable, sessionConfig)` is for tables reached through a patient. It takes precedence, and declaring it is what marks a model as patient-linked.

### Why every syncing model must declare one

Without a declaration, "nobody thought about this" and "this goes to everyone" would look the same, and a new model would sync everywhere by accident. Requiring one, even one that returns `null`, makes whoever writes the model decide. `Model.validateSync` in `packages/database/src/models/Model.ts` enforces it when the model initialises: a model that pulls from central with neither method throws, and the message says to return `null` if the table syncs everywhere.

The lookup path has no equivalent check for `buildSyncLookupQueryDetails`. This check is the only thing that forces the question, and it asks about the path that is not used.

### Tables that sync everywhere

`Facility`, `ReferenceData`, `Patient`, `Location` and many others return `null` from `buildSyncFilter`, so every row changed since `since` is sent. Patients themselves sync everywhere; it is what hangs off a patient that is scoped.

### Tables scoped to a facility

A few are scoped with a plain clause. `PatientFacility` and `ReferenceDrugFacility` use `facility_id IN (:facilityIds)`. `Setting` adds `OR scope = 'global'`. `LocationAssignment` joins through `locations` and `location_groups` to reach the facility.

### Tables with a patient id

`buildPatientSyncFilterViaPatientId` is the generic builder for a table with its own `patient_id` column. It returns `null` when no patients are in the pass, and otherwise:

```sql
WHERE patient_id IN (SELECT patient_id FROM <marked patients table>)
  AND updated_at_sync_tick > :since
```

`PatientAdditionalData` uses it, as do the allergy, birth data, care plan and condition tables and others. The column names are unqualified, so it only suits a query with no joins.

### Tables reached through an encounter

`buildEncounterLinkedSyncFilter` takes the chain of tables from the model's own up to `encounters`, joins them in order, and requires the encounter's patient to be marked and the model's own tick to be above `since`. Each join column defaults to the singular of the next table plus `_id`; an entry can spell out a different column, or make its join an inner one.

`ImagingRequest` passes its own table and `encounters`. `ImagingResult`, one level deeper, passes its table, `imaging_requests` and `encounters`. About three dozen models use this builder: discharges, diagnoses, triages, vitals, tasks, the invoice tables. Models whose columns do not follow the convention write the joins by hand, as `SurveyResponseAnswer` does through `survey_responses.response_id`.

### Encounters

`Encounter.buildPatientSyncFilter` is written by hand because of sync-all-lab-requests. An encounter is included if its patient is marked, or, with that setting on, if it has a lab request. For the second case it joins a subquery of encounters with lab requests changed since `since`, grouped by encounter (one encounter can have several lab requests), and leaves out patients already marked, since those encounters are coming anyway.

### Lab requests

`LabRequest.buildPatientSyncFilter` returns an empty string when sync-all-lab-requests is on: every lab request since `since`, whoever the patient is. Otherwise it behaves like any encounter-linked model. `LabTest`, `LabTestPanelRequest` and `LabRequestAttachment` do the same.

### Notes

A note's `record_id` can point at many kinds of record, so `buildNoteLinkedSyncFilter` joins every table a note can attach to, and the encounter for the ones that reach their patient through an encounter (triages, lab requests, imaging requests). It then accepts a note if any of these holds:

- it is on a patient who is marked
- it is on a triage, lab request or imaging request whose encounter's patient is marked
- it is on any other kind of record whose own `patient_id` is marked

The record types come from `NOTE_RECORD_TYPE_VALUES` in `@tamanu/constants`, where a comment says that adding a type means changing this builder. The joins pick up a new type by themselves; the conditions are written out per type and do not. Nothing tests that the two stay in step.

The name is misleading. The other generic builders are for tables that hang off the thing they are named for. This one is for the notes table itself.

## Sync-all-lab-requests on this path

The `sync.syncAllLabRequests` facility setting is read once per session. It is on if any of the session's facilities has it on, and always off for mobile clients and for an initial sync. The pass for newly marked patients never sees it.

With it on, this path sends every lab request changed since `since`, the tests, panel requests and attachments for them, and the encounters they belong to, whether or not the patient is marked.

It also sends every note on a lab request, because `buildNoteLinkedSyncFilter` adds that condition when the setting is on. **The lookup path does not.** There the lab flag is a column on the lookup row, notes never carry it, and a note arrives only if its patient is marked. The same facility gets a different set of notes depending on the path.

## How echoes are removed

A session pushes, then pulls. On this path the pull reads the very tables the push has just written to, so everything the client pushed would come straight back. `removeEchoedChanges` in `packages/database/src/sync/removeEchoedChanges.ts` deletes those rows from the outgoing snapshot. It runs once, after all the passes, inside the snapshot transaction.

It joins the snapshot table to itself, since incoming and outgoing rows share it. An outgoing row is deleted when an incoming row for the same record has the same `saved_at_sync_tick` and the same `updated_at_by_field_sum`.

### The saved-at tick

When central persists a push, it stamps every incoming snapshot row with the tick it saved at. The sync tick trigger stamps the real rows with that same tick. So when the pull reads a real row back and finds its tick equal to the incoming row's, the row has not changed since this client pushed it, and it is removed. If anything else has changed the row in between, its tick has moved, and it is kept. That is the purpose of the comparison: a change made by someone else between this session's push and its pull must still reach the client.

This only works if nothing else can ever write with the persist tick, and the persist is arranged to make sure of it. It tick-tocks at the start of its transaction and keeps the tock. Until the transaction commits, no other transaction can see that value as the current tick. Just before committing it tick-tocks again, so the clock is already past that value when anyone else next reads it. Steps that deliberately change pushed records afterwards, such as `adjustDataPostSyncPush`, run after the transaction for the same reason: their writes land on a later tick, are not taken for echoes, and go back to the client.

The lookup path later came to rest on the same property for a different purpose, which is why the two tick-tocks have to stay when this path goes.

### The field sum

The tick is not enough for a row central merged field by field. The merged row is saved at the persist tick like any other, so its tick matches, yet it may now hold values the client has never seen. Removing it as an echo would leave the client with its pre-merge copy.

`PatientAdditionalData` is the only model merged this way. It carries `updatedAtByField`, a map from each field to the tick that field was last changed at. The snapshot stores the sum of those ticks as `updated_at_by_field_sum`: for incoming rows, summed from what the client pushed; for outgoing rows, summed from the saved row by a subquery. If the merge took any field from elsewhere, the sums differ and the row is kept. Models without the map store null on both sides, and two nulls count as equal.

It is a cheap checksum, not an exact comparison.

### On the lookup path

`removeEchoedChanges` still runs on the lookup path, and can never match there. Outgoing rows carry ticks stamped by the lookup build, which are always the other half of a tick-tock from a persist tick, so the two are never equal. That path avoids echoes by recording which device pushed each row.

## What this path lacks

Features added since the lookup table were not added here.

- **Sensitive network scoping.** The session works out its sensitive network and passes it in, but no model filter reads it.
- **Device attribution.** Echo removal covers only what was pushed in the same session. A record pushed in a session whose pull then failed is sent back in the next one.

Switching the lookup table off is therefore not a safe fallback. On a deployment with sensitive networks it would send a network's confidential records to facilities outside it.

One rule exists only in this path's filters and takes effect on neither path. `SurveyResponseAnswer` and `VitalLog` have a branch that leaves out answers to sensitive surveys when `sessionConfig.isMobile` is set. Nothing sets it, and the lookup path has no filter of its own for it.

## What still uses pieces of it

- **The facility bootstrap.** `buildFacilityBootstrap.js` calls `buildSyncFilter()` on nine models (`ReferenceData`, `SensitiveNetwork`, `Facility`, `User`, `UserFacility`, `Role`, `Permission`, `Setting`, `TranslatedString`) and reads their tables directly. This does not depend on the config key and runs in production for every facility syncing from scratch.
- **The patient-linked check.** `getPatientLinkedModels` picks out models by whether `buildPatientSyncFilter` exists. The pass for newly marked patients uses it to choose its models, and the lookup query uses it to decide whether a patient clause applies. Only the method's existence matters, not what it returns.
- **The lookup build.** It imports the join helpers from the filter builder files: `buildEncounterLinkedSyncFilterJoins`, `getPatientIdColumnOfNotes` and `buildNoteLinkedJoins`.
- **Most central sync tests.** `config/test.json5` and the default config in `__tests__/utilities.js` both turn the lookup table off, so a central sync test runs on this path unless its file turns the lookup table on.

## What removing it would involve

Goes with the path:

- `snapshotChangesForModel`, `snapshotOutgoingChangesFromModels` and the choice between paths in `snapshotOutgoingChanges`
- the `sync.lookupTable.enabled` key and the `useSyncLookup` session parameter. The guard in `prepareSession` that refuses sessions until the lookup table has been built stays, without the check on the key
- `removeEchoedChanges`, and with it everything only it reads: `saved_at_sync_tick` and `updated_at_by_field_sum` on snapshot rows, `updated_at_by_field_sum` on lookup rows, and the subquery in the lookup build that computes the sum
- the bodies of `buildPatientSyncFilter` on every model, with `buildPatientSyncFilterViaPatientId`, `buildEncounterLinkedSyncFilter` and the filter half of `buildNoteLinkedSyncFilter`
- the `isMobile` field of the session config, which nothing sets
- the tests for this path, and the test config that selects it

Has to stay, because something else uses it:

- `buildSyncFilter` on the nine bootstrap models
- some marker of which models are patient-linked, for `getPatientLinkedModels`
- the join helpers the lookup build imports
- a check that every syncing model has declared who receives it. `Model.validateSync` asks for the old methods; it would need to ask for `buildSyncLookupQueryDetails` instead
- the persist's two tick-tocks, and its post-commit steps staying outside the transaction

Removing the path also changes what the tests cover. Most central sync tests would run against the lookup table for the first time.
