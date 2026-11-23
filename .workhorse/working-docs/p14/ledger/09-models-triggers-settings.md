# Model sync config, trigger installation, migrations and settings (MDL)

Code is the worktree at main (commit `22d3edaa36` plus ledger commits). Paths are relative to the repository root; `DB` below means `packages/database/src`, `CSM` means `packages/central-server/app/sync/CentralSyncManager.js`, `SOC` means `packages/central-server/app/sync/snapshotOutgoingChanges.js`. No tests were run and no database was queried: everything about installed triggers and primary keys is read from migrations and hooks, not from a live schema. Where a later migration might have changed a baseline fact I grepped `migrations/` for it.

## Drift

- MDL-03 There are five directions in `SYNC_DIRECTIONS`, not four: `do_not_sync` is one. Of the four that sync, `push_to_central_then_delete` is a variant of push that the transcript's "four" does not obviously include. Mobile has a different four (no `then_delete`).
- MDL-05 "Reference data" is not defined by one constant that lists the tables that sync everywhere. `REFERENCE_TYPES` and `OTHER_REFERENCE_TYPES` in `packages/constants/src/importable.ts` list the *importable* reference types. The set of tables that actually sync to every client is whatever models return `null` from `buildSyncFilter`, which includes tables not in that list (users, roles, permissions, surveys, programs, templates, report definitions) and excludes one table that is (`reference_drug_facilities` is facility-scoped; see MDL-06).
- MDL-06 "Reference data now has facility-specific reference data, though it still syncs everywhere" is wrong on the second half. Facility-scoped reference-style tables do not sync everywhere: `ReferenceDrugFacility`, `LocationAssignment`, `LocationAssignmentTemplate`, `Setting`, `PatientFacility` filter by `facility_id IN (:facilityIds)`.
- MDL-09 Hard deletes: the transcript is right that the sync engine does not carry them to clients, but "we haven't gone there" is outdated for the central side. A hard-delete trigger on lookup-tracked tables now flags the lookup row, and the self-heal pass deletes the lookup row. The deletion still never reaches facilities or mobile.
- MDL-10 "We never use composite primary keys" is wrong at the database level. Seven or more syncing tables have a composite `PRIMARY KEY` over their natural columns and a separate stored generated `id` text column which is what sync uses (MDL-11). The statement is right in spirit: sync identifies a record by a single `id` column.
- MDL-11 The transcript says the computed id is "I think always stored". Confirmed for the text ids, but two models use a non-stored generated expression (`TEXT GENERATED ALWAYS AS ("patient_id")` with no `STORED`, Postgres 17 syntax) and two sync-internal tables use a bigint copy of a tick column. Details in MDL-11.
- MDL-14 / MDL-15 "Hooks end with trigger" is only mostly right: eight hooks, and the names do not all end in trigger. Which tables get which trigger differs by server (flag and delete triggers central only).
- MDL-16 The transcript's description of "tables without trigger is filtered afterwards to exclude the global exclude list ... and all non-syncing tables" is right for the sync tick, `updated_at`, flag and delete hooks, but not for the notify and changelog hooks, which use `GLOBAL_EXCLUDE_TABLES` and `NON_LOGGED_TABLES` respectively.
- MDL-18 Migrations: "we turn off the sync tick trigger for migrations" is right but the mechanism is a flag in `local_system_facts`, not dropping the trigger. A comment in one migration still says the trigger is dropped (stale).
- MDL-19 / MDL-20 The transcript is right that migration code imports application code, and the example is current: one recent migration imports a post-migration hook function; others import `@tamanu/settings` and `config`.
- MDL-21 Marking patients for sync: "register at facility, create encounter, click sync" is incomplete. Also appointments (outpatient and location booking), program registry registration, mobile edits and the patient merge reconcile. The central side does not hold the "unmark" machinery the transcript implies; no unmark code path exists except the merge reconcile (hard delete and recreate).
- MDL-25 `sync.lookupTable.avoidRepull` is not in settings: it is a config-file key (`packages/central-server/config/default.json5:60`). Same finding as the lookup ledger (LKP-30).
- MDL-27 A settings key mismatch (not in the transcript): central streaming sync routes read `sync.databasePollInterval` and `sync.databasePollBatchSize`, but the schema declares them as `sync.streaming.databasePollInterval` and `sync.streaming.databasePollBatchSize`. See MDL-27.
- MDL-30 The lab-request escape hatch in the pull query bypasses the sensitive network scoping on purpose per the spec, and nothing in the lookup population excludes sensitive records (MDL-30).
- Also: the lookup ledger said no base implementation of `buildSyncLookupQueryDetails` exists and nothing requires it. Confirmed (MDL-07).

## Claims

### MDL-01 Every sync node syncs all reference data
Source: Part 1 00:18:02
Verdict: partly
Evidence: Central does not filter models whose `buildSyncFilter` returns `null` (see table in MDL-03). The lookup pull clause admits rows with `facility_id IS NULL AND sensitive_network_id IS NULL` (`packages/central-server/app/sync/snapshotOutgoingChanges.js:268-274`). Facility-scoped models (MDL-06) and mobile (not every table has a mobile model, per the mobile ledger MOB-06) are exceptions.
Why: reference data is the configuration everything else rests on; no code comment states it.
Notes: "all clients get all reference data" holds for facility servers for every `PULL_FROM_CENTRAL` model with `buildSyncFilter` returning `null`. A new reference-style model that is facility-bound must return a facility filter instead.

### MDL-02 Users, including password hashes, sync everywhere (Part 1 00:19:15, 00:20:25)
Source: Part 1 00:19:15, 00:20:25
Verdict: confirmed
Evidence: `DB/models/User.ts:248-250` (`buildSyncFilter` returns `null`, "syncs everywhere"); `syncDirection: PULL_FROM_CENTRAL` at `User.ts:176`. The `password` attribute is a real column (`User.ts:142`). `defaultScope: { attributes: { exclude: ['password'] } }` (`User.ts:171-173`) hides it from ordinary Sequelize reads only. Every sync snapshot builder reads `model.getAttributes()`, which is the raw attribute list and includes `password`: lookup build `DB/sync/buildSyncLookupSelect.ts:31,46-48`; non-lookup path `packages/central-server/app/sync/snapshotOutgoingChanges.js:44,74`; bootstrap `packages/central-server/app/sync/buildFacilityBootstrap.js:43-44`. Mobile has `password?: string` on its `User` entity (`packages/mobile/App/models/User.ts:30-31`) and no excluded-column override (MDL-04).
Why: no comment explains it. `inference`: facility servers and mobile need the hash to authenticate offline (`llm/docs/authentication.md` describes local login fallback with bcrypt comparison).
Notes: the whole user row, including the bcrypt hash, is stored in `sync_lookup.data` on central and written to every facility database and every mobile device that pulls users. `User.sanitizeForInsert` (`User.ts:81-91`) only avoids rehashing an already-hashed password on incoming writes; it does not remove it.

### MDL-03 Sync directions, and which models use which filter
Source: Part 1 01:08:58, Part 2 00:53:51, Part 3 01:25:30
Verdict: partly (see Drift MDL-03)
Evidence: `packages/constants/src/sync.ts:3-9`:

| Direction | Meaning in code |
| --- | --- |
| `do_not_sync` | Table is not synced and has no `updated_at_sync_tick` attribute. Public-schema models must also be listed in `NON_SYNCING_TABLES` (enforced at `DB/services/database.js:281-292`). |
| `push_to_central` | Pushed by facility (and mobile) to central; never pulled. Central keeps it; the facility copy stays. `getModelsForPush` (`DB/sync/getModelsForDirection.ts:20-25`). |
| `push_to_central_then_delete` | As above, then the facility hard-deletes its local copy after a successful push (`packages/facility-server/app/sync/deleteRedundantLocalCopies.js:6-22`, `force: true`). Mobile has no such direction (`packages/mobile/App/models/types.ts:1-6`). |
| `pull_from_central` | Pulled from central; never pushed. `getModelsForPull` (`getModelsForDirection.ts:14-18`). |
| `bidirectional` | Both. |

Generic filter builders: `buildPatientSyncFilterViaPatientId` (`DB/sync/buildPatientSyncFilterViaPatientId.ts:1-9`: patient_id in marked-for-sync table and tick greater than since; null when no patients are marked); `buildEncounterLinkedSyncFilter` (`DB/sync/buildEncounterLinkedSyncFilter.ts`, joins a path of tables to `encounters`); `buildNoteLinkedSyncFilter` (`DB/sync/buildNoteLinkedSyncFilter.ts:69-116`). Every patient-scoped builder returns `null` when `patientCount === 0`, meaning nothing is pulled for that model in that pass.

The table below is generated by grep over `DB/models/` (`syncDirection:` and `buildSyncFilter` / `buildPatientSyncFilter` per file). "Global" means `buildSyncFilter` returns `null`; "Patient" means patient-scoped by marked-for-sync; "Facility" means filtered by `facility_id IN (:facilityIds)`. Where a patient-scoped model also checks the facility, that is stated.

| Model | Direction | Scope | Filter builder |
| --- | --- | --- | --- |
| Patient | bidirectional | Global (all patients to all facilities) | `buildSyncFilter` null (`Patient.ts:346-348`); lookup details return null (`:350`) |
| PatientAdditionalData, PatientAllergy, PatientBirthData, PatientCarePlan, PatientCondition, PatientContact, PatientDeathData, PatientFamilyHistory, PatientFieldValue, PatientInvoiceInsurancePlan, PatientIssue, PatientOngoingPrescription, PatientSecondaryId, PortalSurveyAssignment, Notification | bidirectional | Patient | generic via `patient_id` (`= buildPatientSyncFilterViaPatientId`) |
| PatientProgramRegistration | bidirectional | Global filter (`buildSyncFilter` null, `PatientProgramRegistration.ts:153`) but lookup carries patient id | none needed |
| PatientProgramRegistrationCondition | bidirectional | Patient | custom SQL via registration (`:76-85`) |
| Encounter | bidirectional | Patient, plus every encounter with a lab request when `syncAllLabRequests` | custom (`Encounter.ts:359-420`) |
| Discharge, EncounterDiagnosis, EncounterDiet, EncounterHistory, EncounterPausePrescription, EncounterPausePrescriptionHistory, EncounterPrescription, ImagingRequest, ImagingRequestArea, ImagingResult, Invoice, InvoiceDiscount, InvoiceInsurancePlanPayment, InvoiceItem, InvoiceItemDiscount, InvoiceItemFinalisedInsurance, InvoicePatientPayment, InvoicePayment, InvoicesInvoiceInsurancePlan, LabRequestLog, MedicationDispense, PharmacyOrder, PharmacyOrderPrescription, Procedure, ProcedureAssistantClinician, ProcedureSurveyResponse, SurveyResponse, Task, TaskDesignation, Triage, Vitals | bidirectional | Patient (via encounter) | `buildEncounterLinkedSyncFilter` with a table path |
| DocumentMetadata | bidirectional | Patient (via encounter) | custom, uses `buildEncounterLinkedSyncFilterJoins` (`DocumentMetadata.ts:86-`) |
| LabRequest, LabRequestAttachment, LabTest, LabTestPanelRequest | bidirectional | All rows when `syncAllLabRequests`, else Patient via encounter | custom; return `''` when `syncAllLabRequests` (`LabRequest.ts:305-323`) |
| Note | bidirectional | Patient (record-type OR list) | `buildNoteLinkedSyncFilter` (`Note.ts:141`) |
| AdministeredVaccine, Referral, ContributingDeathCause, AiDocument, MedicationAdministrationRecord, MedicationAdministrationRecordDose, Prescription, SurveyResponseAnswer, VitalLog | bidirectional | Patient | custom SQL; `SurveyResponseAnswer` and `VitalLog` drop sensitive-survey answers for mobile sessions (`SurveyResponseAnswer.ts:60-`, `VitalLog.ts:65-`) |
| Appointment, AppointmentProcedureType, AppointmentSchedule | bidirectional | Patient and Facility | custom, `COALESCE(location_groups.facility_id, locations.facility_id) IN (:facilityIds)` (`Appointment.ts:155-173`) |
| PatientFacility | bidirectional | Facility | `WHERE facility_id in (:facilityIds)` (`PatientFacility.ts:58-60`) |
| ReferenceData, ReferenceDataRelation, ReferenceDrug, ReferenceMedicationTemplate, ReportDefinition, ReportDefinitionVersion, TaskTemplate, TaskTemplateDesignation, TranslatedString, UserDesignation, UserPreference, InvoiceProduct, PortalUser | bidirectional | Global | `buildSyncFilter` null |
| Asset, CertifiableVaccine, Department, Facility, ImagingAreaExternalCode, ImagingTypeExternalCode, InvoiceInsurancePlan, InvoiceInsurancePlanItem, InvoicePriceList, InvoicePriceListItem, LabTestPanel, LabTestPanelLabTestTypes, LabTestType, Location, LocationGroup, PatientFieldDefinition, PatientFieldDefinitionCategory, Permission, ProcedureTypeSurvey, Program, ProgramDataElement, ProgramRegistry, ProgramRegistryClinicalStatus, ProgramRegistryCondition, ProgramRegistryConditionCategory, Role, ScheduledVaccine, SensitiveNetwork, Survey, SurveyScreenComponent, Template, User, UserFacility, UserLeave | pull_from_central | Global | `buildSyncFilter` null |
| LocationAssignment, LocationAssignmentTemplate, ReferenceDrugFacility | pull_from_central | Facility | custom SQL on `facility_id IN (:facilityIds)` |
| Setting | pull_from_central | Facility OR global scope | `(facility_id in (:facilityIds) OR scope = 'global')` (`Setting.ts:245-247`) |
| DeathRevertLog | push_to_central | (push only) | `buildSyncFilter` null, present anyway |
| IPSRequest, ReportRequest, UserLoginAttempt | push_to_central | (push only) | none (ReportRequest has a `facilityIds` SQL fragment elsewhere) |
| Attachment, CertificateNotification, FacilitySettingMigration, PatientCommunication | push_to_central_then_delete | (push only) | none |

Models that do not sync (`DO_NOT_SYNC`): AccessLog (`logs.accesses`), AiChatSession, BrowserTelemetrySpan, ChangeLog (`logs.changes`), DHIS2PushLog, DebugLog, Device, EncounterDischargeDraft, EncounterDischargeDraftMedication, FormBuilderChatJob, IdempotencyKey, LocalSystemFact, LocalSystemSecret, MSupplyPushLog, OneTimeLogin, PatientVRSData, PortalOneTimeToken, RefreshToken, ScheduledTaskState, SyncDeviceTick, SyncFacilityRun, SyncLookup, SyncLookupTick, SyncQueuedDevice, SyncSession, UserLocalisationCache, UserRecentlyViewedPatient, plus the FHIR models (`fhir/Job`, `fhir/Resource`, `fhir/JobWorker`, `fhir/WriteLog`; every `Fhir*` resource model inherits `DO_NOT_SYNC` from `Resource`).
Why: sync directions exist so tables sync only the way they need to; no comment states it.
Notes: `PatientFacility` is bidirectional with a facility filter, so a facility pulls only its own marks. `Patient` itself syncs to every facility (all patient rows), which is why only the clinical data hangs off marked-for-sync.

### MDL-04 Excluded columns and per-model sanitisers
Source: Part 1 00:20:25, Part 1 01:25:30
Verdict: confirmed (nothing excludes password; there is a short global list and a few incoming-side sanitisers)
Evidence: global column exclusion `DB/sync/constants.ts:6-11`: `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`, applied to every model in `sanitizeRecord` (`DB/sync/sanitizeRecord.ts:5-10`), the lookup select (`buildSyncLookupSelect.ts:46-48`), the non-lookup snapshot (`SOC:74`) and the facility bootstrap (`buildFacilityBootstrap.js:43-44`). No per-model outgoing exclusion exists on the server side. Sanitisers run on incoming data only (`DB/sync/saveIncomingChanges.ts:41-42`): `Model.sanitizeForCentralServer` / `sanitizeForFacilityServer` (`DB/models/Model.ts:204-214`, identity by default) and `prepareSanitizeContext` (`Model.ts:199`, once per batch). Overrides: `Asset` (binary data coercion, `Asset.ts:40-64`), `Attachment` (`Attachment.ts:38-40`, base64 to Buffer on central), `PatientCommunication` (`PatientCommunication.ts:73`), `ReportRequest` (`ReportRequest.ts:153,212`), `ReferenceDrugFacility.sanitizeForFacilityServer` strips `quantity` and `stockStatus` for facilities with mSupply stock-on-hand enabled so a pull never overwrites locally pushed stock (`ReferenceDrugFacility.ts:74-100`). Row-level exclusion: `SurveyResponseAnswer` and `VitalLog` drop answers to sensitive surveys for mobile sessions only.
Mobile: `BaseModel.excludedSyncColumns = ['createdAt','updatedAt','updatedAtSyncTick']` (`packages/mobile/App/models/BaseModelWithoutId.ts:122`), `Attachment` also excludes `filePath` (`packages/mobile/App/models/Attachment.ts:42`); optional `sanitizeRecordDataForPush` / `sanitizePulledRecordData` on `PatientContact`, `AdministeredVaccine`, `PatientFieldDefinition`, `Setting`, `PatientAdditionalData`, `EncounterHistory`, `Prescription` (`packages/mobile/App/services/sync/utils/snapshotOutgoingChanges.ts:46-51`, `saveIncomingChanges.ts:73-79`).
Why: the global list is bookkeeping columns that are local to each server (`updatedAt` etc. are per-server; the migration comment at `DB/migrations/1784843046612-backfillNullCreatedUpdatedAtTimestamps.ts:5-7` says so).
Notes: the transcript's "sanitize for client" does not exist by that name; the names are `sanitizeForCentralServer` and `sanitizeForFacilityServer` (incoming only) and, on mobile, the two pairs above.

### MDL-05 Reference data is both `reference_data` and other tables, and a constant lists them
Source: Part 1 00:18:02, Part 1 02:12:19
Verdict: partly
Evidence: `packages/constants/src/importable.ts:4-62` (`REFERENCE_TYPES`, rows in `reference_data`), `:68-84` (`OTHER_REFERENCE_TYPES`, own tables: department, facility, invoice product, lab test type and panel, location, location group, patient field definition and category, price list and items, insurance plan and items, scheduled vaccine, sensitive network), combined as `MANAGEABLE_REFERENCE_DATA_TYPES` (`packages/constants/src/referenceData.ts:13-17`) and `GENERAL_IMPORTABLE_DATA_TYPES` (`importable.ts:152-`). A separate hard-coded list `REFERENCE_DATA_MODELS` at `DB/services/setFhirRefreshTriggers.js:26-36` names models whose changes should not trigger FHIR rematerialisation. Neither list drives sync.
Why: the transcript's "constant that carries which tables are considered reference data" is most plausibly `importable.ts`; sync does not read it.
Notes: users, roles, permissions, surveys, programs, templates and report definitions sync everywhere but are not in the importable lists. Treat "reference data" in docs as "models that return `null` from `buildSyncFilter`", not as the importable list. No patient data is in the importable lists.

### MDL-06 Facility-specific reference data
Source: Part 2 00:58:19
Verdict: partly
Evidence: `DB/models/ReferenceDrugFacility.ts:70-72` (`WHERE facility_id IN (:facilityIds) AND tick > :since`), `LocationAssignment.ts:57-`, `LocationAssignmentTemplate.ts:77-`, `Setting.ts:245-247`, `PatientFacility.ts:58-60`. Lookup rows carry `facility_id` for these (`ReferenceDrugFacility.ts:103-109`, `PatientFacility.ts:62-68`). The pull clause admits them by `facility_id IN (:facilityIds)` (`SOC:275-277`).
Why: facility-bound data must reach only the facility it belongs to.
Notes: `reference_data` itself has no facility column (grep of `ReferenceData.ts`), so "reference data syncs everywhere" is right for it.

### MDL-07 A model must declare a sync filter so the author considers sync
Source: Part 2 00:58:19
Verdict: confirmed (and the lookup ledger's question answered)
Evidence: `DB/models/Model.ts:106-131` (`validateSync`): throws at `init` when a `PULL_FROM_CENTRAL` or `BIDIRECTIONAL` model has neither `buildSyncFilter` nor `buildPatientSyncFilter`. `Model.ts:34-46` only `declare`s the statics, so there is no base implementation of either. `buildSyncLookupQueryDetails` is not declared in `Model.ts` or `DB/types/` and is called unconditionally on every pull model by the lookup build (`packages/central-server/app/sync/updateLookupTable.js:141,206,303`, as `(await model.buildSyncLookupQueryDetails(...)) || {}`). Every pull and bidirectional model in `DB/models/` implements it (checked by grep, none missing). A model that lacked it would throw `TypeError` during the first lookup build, not at init and not in a test.
Why: comment at `Model.ts:114-120`: "to make sure it is considered".
Notes: `Patient.ts:350` shows the "syncs everywhere" idiom for the lookup method (`return null`; `|| {}` makes the default select). The only test that touches the contract is `DB/__tests__/sync/syncLookupFacilityScope.test.ts:17-43`, which fails if an encounter-linked model's lookup select does not carry `facilities.sensitive_network_id` (MDL-31).

### MDL-08 Patient additional data example and generic patient filter
Source: Part 2 00:53:51, 00:55:08
Verdict: confirmed
Evidence: `PatientAdditionalData.ts:96` `syncDirection: BIDIRECTIONAL` (the transcript's line 96 is right); `:161` `buildPatientSyncFilter = buildPatientSyncFilterViaPatientId`; the generic builder (`buildPatientSyncFilterViaPatientId.ts:1-9`) returns `null` with zero patients and otherwise `WHERE patient_id IN (SELECT patient_id FROM <marked>) AND updated_at_sync_tick > :since`. `PatientAdditionalData` is the only model with `updatedAtByField` (field-wise merge); see lookup ledger.
Why: n/a.
Notes: the transcript's "Encounter is the exception" is right for the model path (custom, `Encounter.ts:359-420`); many other models also use custom SQL (table above). Detail of those filters is in ledger 05.

### MDL-09 Hard deletes are not handled by sync
Source: Part 1 01:05:15, 01:06:17
Verdict: partly (see Drift)
Evidence: sync identifies records by row state; a soft delete is an ordinary update with `deleted_at` set (`buildSyncLookupSelect.ts:42`, `deleted_at IS NOT NULL` as `is_deleted`), carried as `is_deleted` in the snapshot (`SOC:239-250`). Receivers apply `deletedAt` decisions in `saveUpdates` (`DB/sync/saveChanges.ts:36-79`). No code propagates a hard delete to another node. Where the code warns or handles hard deletes:
- `llm/project-rules/coding-rules.md:94` "Clinical data should be soft-deleted, never hard-deleted".
- `docs/ruled-out-actions.md:25` (never hard-delete from psql).
- Central lookup: delete trigger `delete_<table>_from_sync_lookup` (flags only, `DB/services/migrations/hooks/postMigrationHooks.ts:160-189`), function `flag_sync_lookup_for_rebuild_on_hard_delete` (migration `DB/migrations/1784602090407-addSyncLookupHardDeleteTrigger.ts`), self-heal pass deletes the lookup row (`updateLookupTable.js:343-`), concurrent hard delete during a build aborts and retries (`updateLookupTable.js:8-22,95,417-444,483`; `CSM:417-419`). Spec: `specs/sync/lookup-table.md:28,30,41`.
- Changelog marks hard deletes (`DB/migrations/1785457572615-captureHardDeletesInChangelog.ts`, `is_hard_delete`; `specs/audit/changelog.md:24-28,61` says a hard delete's entry stays on the server that did it).
- Sanctioned hard deletes in code: `PUSH_TO_CENTRAL_THEN_DELETE` local cleanup (`facility-server/app/sync/deleteRedundantLocalCopies.js`), `Encounter` clearing discharge drafts (`Encounter.ts:171,504`, non-syncing tables), patient merge `PatientFacility.destroy({ force: true })` (`packages/central-server/app/admin/patientMerge/mergePatient.js:418`, comment "the only place where hard deletion is allowed"), ephemeral token and chat cleanups (non-syncing).
- `genericBeforeDestroy` hooks (`DB/utils/beforeDestroyHooks.ts:52-60`, wired at `Model.ts:73-74`) cascade destroys to dependent associations for public-schema models; on a paranoid model that is a soft delete cascade.
Why: soft deletes replaced tombstones in sync v1 (transcript only; `unverifiable`).
Notes: `PatientFacility` hard delete at merge relies on creating new rows, not on propagation. Changing a syncing table's rows with plain `DELETE` leaves other nodes holding the row indefinitely.

### MDL-10 No composite primary keys
Source: Part 1 01:06:17, 01:07:27
Verdict: partly (see Drift)
Evidence: single-column `id` is what sync reads (`ON ... WHERE id` in `saveChanges.ts:74-79`; `sync_lookup.record_id`). But `migrations/000_baseline.sql` declares composite primary keys: `patient_facilities` `(facility_id, patient_id)` (`:5951`), `patient_field_values` `(patient_id, definition_id)` (`:5983`), `patient_program_registrations` `(patient_id, program_registry_id)` (`:6031`, plus `UNIQUE (id)` at `:6023`), `translated_strings` `(string_id, language)` (`:6463`), `lab_test_panel_lab_test_types` `(lab_test_panel_id, lab_test_type_id)` (`:5743`). Later migrations create `reference_drug_facilities` and `ai_documents` with several `primaryKey: true` columns (`DB/migrations/1764594045328-addReferenceDrugFacilitiesTable.ts:11-23`, `1778035386449-createAiDocuments.ts:12-24`) and move `patient_invoice_insurance_plans` and `patient_ongoing_prescriptions` to composite keys (`1781222400001-...:112`, `1770250000001-...:53`). The Sequelize models mirror this with several `primaryKey: true` attributes (`PatientFacility.ts:25,33`, `TranslatedString.ts:39,51`, `AiDocument.ts:38-54`, `ReferenceDrugFacility.ts:27,36`, `PatientInvoiceInsurancePlan.ts:31,39`, `PatientOngoingPrescription.ts:26,34`, `PatientProgramRegistration.ts:34,42`).
Why: comment `PatientFacility.ts:16-17`: "a generated primary key that enforces one per patient, even across a distributed sync system". `1778035386449-createAiDocuments.ts:6-7`: two facilities independently generating a summary for the same logical record.
Notes: `lab_test_panel_lab_test_types` composite key: whether it also has a generated id was not checked (no `id` in the baseline lines read). The unique-constraint deferrability test whitelists these `*_id_key` constraints (`packages/central-server/__tests__/sync/uniqueConstraintDeferrability.test.js:11-22`), see MDL-12.

### MDL-11 Computed ids: which models and how
Source: Part 1 01:07:27
Verdict: confirmed (with extra cases)
Evidence: stored generated `id` expressions (`;` joins, with `;` inside a part replaced by `:`):
- `PatientFacility`: `patient_id;facility_id` (`PatientFacility.ts:18`).
- `PatientFieldValue`: `patient_id;definition_id` (`PatientFieldValue.ts:20`).
- `PatientProgramRegistration`: `patient_id;program_registry_id` (`PatientProgramRegistration.ts:27`).
- `PatientOngoingPrescription`: `patient_id;prescription_id` (`PatientOngoingPrescription.ts:19`).
- `PatientInvoiceInsurancePlan`: `patient_id;invoice_insurance_plan_id` (`PatientInvoiceInsurancePlan.ts:24`).
- `ReferenceDrugFacility`: `reference_drug_id;facility_id` (`ReferenceDrugFacility.ts:19`).
- `TranslatedString`: `string_id;language` (`TranslatedString.ts:31`).
- `UserPreference`: `user_id;key;COALESCE(facility_id,'')` (`UserPreference.ts:18`).
- `AiDocument`: `type;record_type;record_id` (`AiDocument.ts:30`).
- `PatientAdditionalData` and `PatientBirthData`: `TEXT GENERATED ALWAYS AS ("patient_id")` with no `STORED` keyword in the model source (`PatientAdditionalData.ts:53`, `PatientBirthData.ts:35`); the baseline has `id text GENERATED ALWAYS AS (patient_id) STORED` for both (`000_baseline.sql:3001,3054`), so they are stored in the database.
- Not sync-bearing: `SyncDeviceTick` (`id BIGINT GENERATED ALWAYS AS (persisted_at_sync_tick)`), `SyncLookupTick` (`lookup_end_tick`).
Why: determinism and one-per-pair across distributed writers (comments in model files). Setters ignore `id` (`set() {}`), and `saveUpdates` strips `id` from the SET clause because Postgres rejects writing a generated column (`saveChanges.ts:64-78`).
Notes: a BEFORE ROW trigger sees NULL for a stored generated column, which is why the lookup flag trigger had to move to an AFTER trigger (`1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:5-12`, MDL-14). Any new composite-identity model should follow this pattern.

### MDL-12 Unique constraints and self-referencing FKs on syncing tables must be deferrable (not in transcript)
Source: not in the transcript
Verdict: confirmed
Evidence: tests `packages/central-server/__tests__/sync/uniqueConstraintDeferrability.test.js:23-` (all unique constraints and indexes on syncing tables must be `DEFERRABLE` except a named list) and `selfReferencingFkDeferrability.test.js:6-` (self-referencing FKs on syncing tables must be deferrable). Migration reference in the test comment: TAM-7004, `DB/migrations/1785000000000-makeUniqueConstraintsDeferrable.ts`.
Why: incoming sync applies rows in bulk in arbitrary order within a transaction, so immediate checks can fail.
Notes: a new syncing model with a unique constraint must make it deferrable or add it to the whitelist with a reason.

### MDL-13 Robustness via database triggers, not ORM hooks
Source: Part 1 00:23:38, 00:24:55
Verdict: confirmed, with one ORM hook exception
Evidence: tick, `updated_at`, flag, delete and changelog behaviour are all database triggers installed by post-migration hooks (MDL-14). The one ORM hook in the sync path is `Encounter.afterCreate` marking a patient for sync (`DB/utils/onCreateEncounterMarkPatientForSync.ts:15-39`, wired at `Encounter.ts:185`; comment at `:1-9` says it deliberately fires only on single create, not bulk create, since sync uses `bulkCreate(..., { hooks: false })` at `DB/sync/saveChanges.ts:33`).
Why: `onCreateEncounterMarkPatientForSync.ts:1-9`.
Notes: ORM hooks do not fire for raw SQL or bulk sync writes, so any logic that must always hold belongs in a trigger.

### MDL-14 Post-migration hooks: what each installs
Source: Part 3 01:26:26, 01:28:02, 01:29:50
Verdict: confirmed (names differ from the transcript's descriptions)
Evidence: `DB/services/migrations/hooks/postMigrationHooks.ts:286-295`, run in this order by `runPostMigration` (`hooks/migrationHooks.ts:25-27`), invoked after each migration batch (`DB/services/migrations/migrations.js:434` for up, `:543` for down). Each hook has prerequisites (`requireFunction`/`requireTable`); a hook whose prerequisite is missing is skipped with a log line (`migrationHooks.ts:7-19`).

| Hook | What it does | Tables | Server |
| --- | --- | --- | --- |
| `addUpdatedAtSyncTickColumn` (`:46-68`) | adds `updated_at_sync_tick BIGINT NOT NULL DEFAULT n` plus an index; `n` is `-999` on a facility, `0` on central | all tables in schemas `public` and `logs` lacking the column, minus `GLOBAL_EXCLUDE_TABLES` and `NON_SYNCING_TABLES` | both |
| `addUpdatedAtTrigger` (`:70-87`) | `set_<table>_updated_at` BEFORE INSERT OR UPDATE calling `set_updated_at()` | same exclusions | both |
| `addOrReplaceUpdatedAtSyncTickTrigger` (`:89-108`) | drops and recreates `set_<table>_updated_at_sync_tick` BEFORE INSERT OR UPDATE calling `set_updated_at_sync_tick()` | same exclusions | both |
| `addOrReplaceSyncLookupDisabledFlagTrigger` (`:112-158`) | AFTER INSERT OR UPDATE trigger `flag_<table>_for_lookup_rebuild` calling `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()`; removes it where no longer wanted | only lookup-tracked tables (models with `PULL_FROM_CENTRAL` or `BIDIRECTIONAL`, public schema), minus exclusions | central only |
| `addSyncLookupDeleteTrigger` (`:160-189`) | AFTER DELETE trigger `delete_<table>_from_sync_lookup` calling `flag_sync_lookup_for_rebuild_on_hard_delete()` | lookup-tracked tables, minus exclusions | central only |
| `reconcileNotifyTableChangedTrigger` (`:217-253`) | adds or removes `notify_<table>_changed` AFTER INSERT/UPDATE/DELETE calling `notify_table_changed()` | central: `CENTRAL_NOTIFY_CHANGE_TABLES` (`public.settings`) plus every public table with a `patient_id` column that is not in `NON_SYNCING_TABLES`; facility: `FACILITY_NOTIFY_CHANGE_TABLES` (`public.appointments`, `public.notifications`, `public.settings`, `public.tasks`) | both |
| `addRecordChangeTrigger` (`:255-273`) | `record_<table>_changelog` constraint trigger (deferred) calling `logs.record_change()` | all public and logs tables minus `GLOBAL_EXCLUDE_TABLES` and `NON_LOGGED_TABLES` (`DB/services/migrations/constants.ts:37-85`) | both |
| `enableSyncTickTrigger` (`:275-284`) | not a trigger: sets `local_system_facts` key `syncTrigger` to `enabled` | n/a | both |

Constants: `GLOBAL_EXCLUDE_TABLES = ['public.SequelizeMeta']` (`constants.ts:1-4`). `NON_SYNCING_TABLES` (`constants.ts:6-35`) lists 28 tables. Schemas covered are `public` and `logs` only (`DB/utils/tablesWithTrigger.ts:37,71,97`, `allTables`), so the `fhir` schema receives none of these.
Why: `postMigrationHooks.ts:110-111` (flag trigger is AFTER because a BEFORE ROW trigger sees NULL for stored generated columns).
Notes: a model with `DO_NOT_SYNC` in the `logs` schema (`AccessLog` as `logs.accesses`, `ChangeLog` as `logs.changes`) is not in `NON_SYNCING_TABLES`, so the baseline created `updated_at_sync_tick` columns and tick triggers on them (`000_baseline.sql:1617-1660,8854-8868`). The runtime check requiring non-syncing tables to be listed only covers public-schema models (`DB/services/database.js:281-292`). The comment at `packages/constants/src/sync.ts:4` points at `shared/src/services/migrations/constants.js`, which is stale; the list lives at `DB/services/migrations/constants.ts`.

### MDL-15 Notify triggers and what listens
Source: Part 3 01:28:02, 01:29:50
Verdict: confirmed
Evidence: central listeners: settings cache invalidator and settings path listeners (`packages/central-server/app/settingsListeners.js:15-28`, comment at `DB/services/migrations/constants.ts:87-89`) and, sync-related, `registerSyncLookupUpdateListener` (`packages/central-server/app/sync/registerSyncLookupUpdateListener.js:10-20`), which on `UPDATE` with `patient_id` among the changed columns calls `refreshChildRecordsForSync` so children of a record whose patient changed re-queue for sync; wired at `packages/central-server/app/createApp.js:20`. Facility listeners: settings cache and refresher, websocket fan-out for `tasks` and `appointments` and the dashboard for `notifications` (`packages/facility-server/app/services/websocketService.js:48-70`, `constants.ts:91-99`). Sync-related: the central patient-id tables and (indirectly) nothing on the facility side; the settings, tasks, appointments and notifications triggers are not sync-related.
Why: comment `constants.ts:87-99` says add a table to the list before listening for its changes.
Notes: this is a centrally-installed notify trigger on every table with a `patient_id` column, which is how sync learns of patient reassignment (merge).

### MDL-16 Triggers installed only where wanted; exclusion lists
Source: Part 3 01:26:26, 01:28:02
Verdict: partly
Evidence: see MDL-14 table. The flag and delete triggers also depend on `isTableLookupTracked` (`postMigrationHooks.ts:39-44`), which keys on the model's `syncDirection` and public schema, so `PUSH_TO_CENTRAL*` models do not get them. Postgres truncates trigger names at 63 bytes and the hooks mimic this (`:33-37`).
Why: `postMigrationHooks.ts:33-35`.
Notes: when a database moves from central to facility role (restored from a central backup), the flag hook removes the central-only triggers (`:119-133`).

### MDL-17 Triggers live in migrations, so find the latest definition
Source: Part 1 00:24:55
Verdict: confirmed
Evidence: `set_updated_at_sync_tick()` current definition: `DB/migrations/1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts` (takes no argument; clock detail in ledger 01). `flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()`: same migration (earlier `1784602019354-flagSyncLookupForRebuildOnDisabledTrigger.ts`). `flag_sync_lookup_for_rebuild_on_hard_delete()`: `1784602090407-addSyncLookupHardDeleteTrigger.ts`. The transcript's observation that two adjacent migrations carry identical function text (Part 3 00:40:49) is explained at `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:1-17`: it redefines the functions and installs the per-table triggers directly because the post-migration hook only runs after the whole batch.
Why: that migration comment.
Notes: the same migration is "idempotent, so a database that already applied it under its earlier timestamp re-runs it harmlessly" (`:15-17`).

### MDL-18 Migrations disable the sync tick trigger; why
Source: Part 2 01:19:05, 01:20:37
Verdict: confirmed (mechanism differs)
Evidence: `PRE_MIGRATION_HOOKS = [disableSyncTickTrigger]` (`hooks/preMigrationHooks.ts:5-21`) upserts `local_system_facts.syncTrigger = 'disabled'`; `runPreMigration` runs before each batch (`migrations.js:378` for up, `:514` for down); `enableSyncTickTrigger` (`postMigrationHooks.ts:275-284`) sets it back to `enabled` after. `set_updated_at_sync_tick()` returns `NEW` unchanged when the fact is `disabled` (`1793235590139-...ts:36-39`). The same switch is available to data migrations as `disableSyncTrigger` (`DB/dataMigrations/index.js:8-17`, "recommended to wrap this in a transaction", else the flag stays disabled if the callback throws).
Why: `preMigrationHooks.ts:9-11`: "Migrations are deterministic, so updating the sync tick causes us to unnecessarily sync large amounts of data". `specs/sync/lookup-table.md:27`.
Notes: if a batch fails between pre and post hooks the flag stays `disabled` until the next successful run (clock ledger CLK-16). A comment in `1784843046612-backfillNullCreatedUpdatedAtTimestamps.ts:9-10` still says `runPreMigration` "drops the set_updated_at_sync_tick triggers"; it does not.

### MDL-19 What a migration author must do for lookup-held rows
Source: Part 2 01:19:05, 01:20:37, 01:21:34
Verdict: partly
Evidence: on central, any insert or update during the disabled window fires the AFTER flag trigger, which calls `flag_for_rebuild_in_sync_lookup(TG_TABLE_NAME, NEW.id::text)` and sets `needs_rebuild` on the lookup row (stubbing one if absent) (`1793235590139-...ts:25-33`, `specs/sync/lookup-table.md:24-27`). A hard delete is flagged by the delete trigger (also active during migrations). The central migration process runs the lookup rebuild, including the self-heal pass over flagged rows, as its final step and the upgrade does not complete until none are flagged (`specs/sync/lookup-table.md:44-48`). So a migration that edits rows of a lookup-tracked table needs no extra step for those rows. What it does not cover: the lookup row's `patient_id`, `facility_id`, `sensitive_network_id` and `encounter_id` come from joins at build time, so rows whose scope changes because a *parent* row changed are flagged only if they are themselves written. Per-model and per-patient full rebuild are requested through facts `lookupModelsToRebuild` and `lookupPatientsToRebuild` (`packages/constants/src/facts.ts:16-17`, `DB/models/LocalSystemFact.ts:109-170`; examples `1787615019000-flagMergedPatientsForLookupRebuild.ts`, `1755227673457` in the baseline list). Facilities do not keep a lookup table: they migrate in place (every server runs the same deterministic migration) and patients newly marked for sync at a facility pull rows from central's lookup, which is why the lookup must hold the migrated form.
Why: transcript (`unverifiable` beyond the above): migrations moved from "migrate on central then sync bulk" to "migrate everywhere in place".
Notes: the rule files do not tell a migration author any of this. `packages/database/CLAUDE.md` covers DDL versus DML, destructive and backward-incompatible markers, and the dbt models, but never mentions the sync tick, the lookup table or `lookupModelsToRebuild`. `llm/project-rules/coding-rules.md` migrations section lists the bulk-update FHIR warning and "Never modify `updated_at_sync_tick` manually" under Sync, nothing on migrations and sync. `llm/docs/initial-overview.md:41-43` describes the trigger but not the disabled mode. Only `specs/sync/lookup-table.md` and the code state it. Mobile migrations do not follow this (mobile ledger MOB-16/17: they ask central to resend).

### MDL-20 Migrations that import application code
Source: Part 3 00:45:23, 00:46:44
Verdict: confirmed
Evidence: by grep of `DB/migrations/`:
- `1793235590139-moveSyncLookupFlaggingToAfterTrigger.ts:2-3` imports `log` from `@tamanu/shared/services/logging/log` and `addOrReplaceSyncLookupDisabledFlagTrigger` from `../services/migrations/hooks/postMigrationHooks` (this is the transcript's example; its behaviour changes if the hook changes).
- `1775525218612-backfillFhirSettingsFromIntegrationsConfig.ts:12,14-15` imports `config`, `selectFacilityIds` (`@tamanu/utils`) and `globalDefaults` from `@tamanu/settings` (so it depends on current settings defaults).
- `config` plus `selectFacilityIds`: `1765504440717-AddAuditLogsRecordTypeRecordIdIndexes.ts`, `1782024666353-cleanupFhirJobsOnFacilityServers.ts`, `1792470684971-addChangelogTableNameLoggedAtIndex.ts` (also `facilityIdsFromEnv`), `000_baseline.ts`.
Why: none stated; the transcript calls it an anti-pattern because a migration should be repeatable as written.
Notes: the others read only config to decide whether this is a central or facility server. Only the first two import code whose behaviour can change independently of the migration.

### MDL-21 Marking patients for sync: every path
Source: Part 1 00:22:10, 00:23:38
Verdict: partly (see Drift)
Evidence: code paths that create a `patient_facilities` row:
- Encounter created (single create only): `onCreateEncounterMarkPatientForSync.ts:15-39`, `INSERT ... ON CONFLICT (patient_id, facility_id) DO NOTHING` for the facility of the encounter's location. Not fired by sync writes (bulk create, no hooks).
- Explicit action: `POST /patientFacility` (`packages/facility-server/app/routes/apiv1/patientFacility.js:7-21`), requires `read Patient` and `create SyncPatient`, `findOrCreate`, then triggers an urgent sync.
- Patient created on a facility server: `packages/facility-server/app/routes/apiv1/patient/patient.js:256`.
- Program registry registration: `.../patient/patientProgramRegistration/patientProgramRegistration.js:100` (`upsert`).
- Appointments: `.../apiv1/appointments.js:213` (outpatient) and `:541` (location booking), `findOrCreate`.
- Mobile: `Patient.markForSync` (`packages/mobile/App/models/Patient.ts:83-91`).
- Patient merge: `reconcilePatientFacilities` (`packages/central-server/app/admin/patientMerge/mergePatient.js:403-435`) hard-deletes the old rows and bulk-creates new ones for every facility that tracked either patient so facilities resync the merged patient from scratch.
- One-off upgrade step re-ticking existing rows (no create): the upgrade step numbered 1789695736431 in `packages/upgrade/src/steps/` (line 61), for a single deployment.
- Demo generator: `packages/central-server/app/subCommands/generate/kioskDemo.js:397`.
- Rows arrive at other nodes through sync as an ordinary bidirectional model.
Spec: `specs/sync/marking-patients-for-sync.md` lists automatic marking (encounter, outpatient appointment, location booking, program registration, patient create on facility, mobile create/edit) and the `SyncPatient` permission.
Why: central resolves which patients to send from the table (`packages/central-server/app/sync/createMarkedForSyncPatientsTable.js:16`, and `CSM:495,596`).
Notes: a `PatientFacility` row has `deletedAt` and could be soft-deleted, but no code does that.

### MDL-22 Can a mark be removed; consequences of unmarking
Source: Part 1 00:22:10, 00:23:38
Verdict: unverifiable (partly confirmed)
Evidence: no UI, API or task removes a mark. The only code removal is the merge reconcile (`mergePatient.js:418`, hard delete, replaced by new rows). `docs/runbooks/` and `docs/sops/` have no unmark procedure (grep for `patient_facilities`, "unmark", "marked for sync" found nothing; `docs/runbooks/facility-restored-from-backup.md` does not mention it). Because there is no hard-delete propagation (MDL-09), a facility-side delete would stay local and central's `patient_facilities` row would remain. The spec does not discuss unmarking.
Why: transcript says the issues were once learnt manually and not remembered ("data remains on the server if you take away the record").
Notes: unmarking leaves the patient's data on the facility; it is not removed. What would need to happen (remove or archive local data, handle a later re-mark pulling again) is not documented anywhere. `inference` on the central row remaining.

### MDL-23 Client declares which tables it wants
Source: Part 1 00:28:10, 00:29:43
Verdict: confirmed (other ledgers own detail)
Evidence: `CSM:489-491` (tables to include from client parameters), cited in mobile ledger MOB-06. No validation checks table dependencies; the client carries that obligation.
Why: transcript only.
Notes: not repeated here.

### MDL-24 Settings and config: every sync-related value
Source: Part 1 00:18:02 onwards, Part 3 00:39:00 onwards
Verdict: confirmed (table), with rollout-flag notes
Evidence: **Central config** `packages/central-server/config/default.json5:45-60`:

| Key | Defined | Default | Controls |
| --- | --- | --- | --- |
| `sync.maxConcurrentSessions` | config | 4 | max active sessions before new ones queue (`CSM:117-124`) |
| `sync.persistedCacheBatchSize` | config | 20000 | batch size when persisting pushed records |
| `sync.pauseBetweenPersistedCacheBatchesInMilliseconds` | config | 50 | pause between those batches |
| `sync.adjustDataBatchSize` | config | 20000 | batch for post-push data adjustment (`DB/sync/adjustDataPostSyncPush.ts:27`) |
| `sync.incomingSyncHookBatchSize` | config | 20000 | batch for model `incomingSyncHook` (`incomingSyncHook.ts:34`) |
| `sync.numberConcurrentPullSnapshots` | config | 4 | concurrent pull snapshot builds (`startSnapshotWhenCapacityAvailable.js:19-24`) |
| `sync.persistUpdateWorkerPoolSize` | config | 5 | parallel updates in `saveUpdates` (`saveChanges.ts:21`) |
| `sync.maxRecordsPerSnapshotChunk` | config | 1000000000 ("essentially off") | chunking of snapshot inserts (`SOC:29,230`) |
| `sync.syncSessionTimeoutMs` | config | null | session timeout |
| `sync.snapshotTransactionTimeoutMs` | config | null | pull snapshot transaction timeout (`CSM:~574`) |
| `sync.lookupTable.enabled` | config | true (test config sets false, `config/test.json5:22-27`) | **rollout flag**: pull from `sync_lookup` or from the models (`SOC:355`, `CSM:191,486`) |
| `sync.lookupTable.perModelUpdateTimeoutMs` | config | null | statement timeout per model build (`updateLookupTable.js:133`) |
| `sync.lookupTable.avoidRepull` | config (not settings) | true | **rollout flag**: exclude records pushed by the pulling device (`SOC:231,~294`; `updateLookupTable.js:133`) |
| `sync.awaitPreparation` | config, no default in file | unset (tests set true) | wait for snapshot preparation inside `startSession` (`CSM:173`) |
| `patientMerge.updateDependentRecordsForResyncEnabled` | config (`default.json5:42-44`) | true | merge-maintainer resync of dependent records |
| `tasks.syncLookupRefresher` (`enabled`, `schedule`) | both config (`default.json5:263-266`, `*/20 * * * * *`) and settings schema (`packages/settings/src/schema/central.ts:935`) | enabled, every 20 seconds | when the lookup build runs (`SyncLookupRefresher.js:10-16` reads `context.schedules`) |

**Central settings** (`packages/settings/src/schema/central.ts`): `sync.maxFlaggedPatientsPerBuild` (`:225-231`, default 1000, how many merge-flagged patients one build rederives; read `updateLookupTable.js:385-388`), `sync.streaming.enabled` (default false), `sync.streaming.databasePollBatchSize` (default 100), `sync.streaming.databasePollInterval` (default 1000 ms) (`:232-253`), and `mobileSync.*` (`:256-316`, exposed to web, high risk): `useUnsafeSchemaForInitialSync` false, `maxBatchesToKeepInMemory` 5, `maxRecordsPerInsertBatch` 2000, `maxRecordsPerUpdateBatch` 2000, `maxRecordsPerSnapshotBatch` 1000, `dynamicLimiter.{initialLimit 10000, minLimit 1000, maxLimit 40000, maxLimitChangePerPage 0.3, optimalTimePerPage 10000 ms}`.
**Facility settings** (`packages/settings/src/schema/facility.ts:273-292`): `sync.syncAllLabRequests` false (description is a placeholder `_`), `sync.urgentIntervalInSeconds` 10 (mobile urgent sync interval, also in `packages/mobile/App/constants/settings.ts:7`).
**Global settings**: `auth.restrictUsersToSync` false (`global.ts:97-101`, read at `DB/models/User.ts:305`).
**Facility config** (`packages/facility-server/config/default.json5:10-43`): `sync.schedule` (`*/1 * * * *`), `sync.host/email/password` (deprecated fallbacks, now facts/`SYNC_URL`), `sync.timeout` 10000, `sync.syncApiConnection.{host,port}`, `sync.persistedCacheBatchSize` 10000, `sync.pauseBetweenPersistedCacheBatchesInMilliseconds` 50, `sync.pauseBetweenCacheBatchInMilliseconds` 50, `sync.persistUpdateWorkerPoolSize` 5, `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` true (`FacilitySyncManager.js:349`), `sync.enabled` true, `sync.jitterTime` `1s`, `sync.backoff.{multiplierMs 300, maxAttempts 15, maxWaitMs 10000}`, `sync.dynamicLimiter.{initialLimit 10, minLimit 1, maxLimit 10000, optimalTimePerPageMs 2000, maxLimitChangePerPage 0.2}`.
**Mobile**: no config file; reads `mobileSync` and `sync.urgentIntervalInSeconds` from settings delivered at login (`packages/mobile/App/services/sync/MobileSyncManager.ts:104`). Defaults duplicated in `packages/mobile/App/services/sync/utils/calculatePageLimit.ts:9`.
**Facts, not settings**: `syncTrigger`, `currentSyncTick`, `lookupModelsToRebuild`, `lookupPatientsToRebuild` (`packages/constants/src/facts.ts`).
Why: transcript (Part 2 00:56:24 onward on the lookup path): the lookup table was put under a rollout flag and the old path was meant to be deleted after some versions; `avoidRepull` was added after the initial launch.
Notes: `sync.lookupTable.enabled` and `sync.lookupTable.avoidRepull` are the two rollout flags the original developer wants removed (transcript Part 2 00:56:24 and 01:21; lookup ledger has the timestamps). The non-lookup path is still live code, and it has no sensitive-network scoping (MDL-31), so `enabled: false` is not a safe fallback now. The project rule `llm/project-rules/settings.md` says new configurable values belong in settings, yet all the above tuning keys live in config.

### MDL-27 Settings key mismatch for streaming poll values
Source: not in the transcript
Verdict: confirmed as a mismatch; consequence not tested
Evidence: `packages/central-server/app/sync/buildSyncRoutes.js:207,266` read `sync.databasePollInterval` and `:320` reads `sync.databasePollBatchSize`; the schema declares `sync.streaming.databasePollBatchSize` and `sync.streaming.databasePollInterval` (`central.ts:232-253`). No other definition exists (grep).
Why: n/a.
Notes: likely the reads return `undefined` and the schema defaults (1000 ms, 100) never apply. I did not check how `ReadSettings.get` treats an unknown path, so the effect on the stream loops is not confirmed. Worth a card.

### MDL-28 Patient additional data and filter via encounter (transcript explanatory claims)
Source: Part 2 00:55:08 to 01:04:50
Verdict: confirmed in outline (detail in ledger 05)
Evidence: see MDL-03 table; the "path to traverse" for imaging results is passed as table names to `buildEncounterLinkedSyncFilter`; the note filter comment saying to alter it when adding record types is derived from `NOTE_RECORD_TYPE_VALUES`, so a new note record type must be added there and the filter updates itself, though the encounter-linked list `recordTypesWithPatientViaEncounter` is hard-coded (`buildNoteLinkedSyncFilter.ts:7`).
Why: n/a.
Notes: `Notes` for lab requests are included when `syncAllLabRequests` (`buildNoteLinkedSyncFilter.ts:105-107`), which contradicts the transcript (ledger 05 noted this).

### MDL-30 Lab requests, sensitive networks and the pull clause
Source: Part 2 00:55:08 (lab requests), spec `specs/sync/sensitive-networks.md`
Verdict: confirmed (code and spec agree)
Evidence: `SOC:262-294` builds `WHERE (patient clause AND (unscoped OR facility match OR network match) OR is_lab_request IS TRUE)`; AND binds tighter than OR, so `OR is_lab_request IS TRUE` is outside both the patient clause and the sensitive-network clause (when `syncAllLabRequests`). `syncAllLabRequests` is true for a session when any facility in the session has `sync.syncAllLabRequests = 'true'` at facility scope (`CSM:519-531`) and the session is not mobile and `since > -1` (`CSM:562`; initial pulls skip historical lab requests). The spec says it plainly: "A facility configured to sync all lab requests receives every lab request, ahead of patient and network scoping" (`specs/sync/sensitive-networks.md`, "Admitting a record to a facility"). Nothing excludes sensitive records when `is_lab_request` is populated: `LabRequest`, `LabTest`, `LabTestPanelRequest`, `LabRequestLog`, `LabRequestAttachment` set `isLabRequestValue: 'TRUE'` (`LabRequest.ts:325`, `LabTest.ts:134`, `LabTestPanelRequest.ts:95`, `LabRequestLog.ts:61`, `LabRequestAttachment.ts:72`) alongside `facilities.sensitive_network_id` from `buildEncounterLinkedLookupSelect` (`DB/sync/buildEncounterLinkedLookupFilter.ts:8-17`), and `Encounter` sets `is_lab_request` to `new_labs.encounter_id IS NOT NULL` (`Encounter.ts:419`), so the parent encounter of a lab request in a sensitive network is also admitted. So: a lab request, its tests and its encounter, recorded at a facility in a sensitive network, are sent to any facility outside the network whose `syncAllLabRequests` is on.
Why: spec rationale for a facility that runs a lab: it needs every lab request. The spec does not say whether the confidentiality of a networked facility is meant to override that; it only states the ordering. The spec's other statement, "Network scoping widens which facilities a record can reach, and nothing else. A facility receives its network's confidential data only for the patients it syncs", is in tension with the lab exception and does not mention it.
Notes: the clause's non-lookup path (`snapshotOutgoingChangesFromModels`) has no network logic at all (MDL-31). The code does not distinguish "lab request from a sensitive network" from any other lab request.

### MDL-31 What a model must declare for sensitive networks
Source: spec `specs/sync/sensitive-networks.md`
Verdict: confirmed
Evidence: a record hanging off an encounter must carry `facilities.sensitive_network_id` in its lookup select and join through `locations` and `facilities` (`buildEncounterLinkedLookupSelect` and `buildEncounterLinkedLookupJoins`, `buildEncounterLinkedLookupFilter.ts:8-29`); the test `DB/__tests__/sync/syncLookupFacilityScope.test.ts:17-43` fails otherwise. Genuinely facility-bound records (appointment, appointment schedule, location assignment, patient facility, facility-scoped setting) set `facilityId` and no network (spec "What carries a network"; `Appointment.ts` lookup select above). The pull clause is `(facility_id IS NULL AND sensitive_network_id IS NULL) OR facility_id IN (:facilityIds) OR sensitive_network_id = :sensitiveNetworkId` (`SOC:268-285`). A session spanning more than one network is refused (`CSM:552-556`). The network scoping only exists on the lookup path (`SOC:232,279-282,316`; the model path reads no `sensitiveNetworkId`).
Why: comment at `SOC:268-272`: a network-scoped record has a null `facility_id` too, so testing facility alone would admit every sensitive record.
Notes: `AiDocument` shows the polymorphic parent case (no network for patient-level documents, `AiDocument.ts` lookup select comment).

## Open questions answered

1. Four sync directions? Five constants, four that sync (MDL-03). Table in MDL-03. Non-syncing models listed there.
2. Checklist for a new model:
   - Declare `syncDirection` in `init` (the base class throws if missing): `Model.ts:82-86`; mobile counterpart throws in the entity constructor (`packages/mobile/App/models/BaseModelWithoutId.ts:60-62`).
   - If it syncs, leave timestamps on (`createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`): `Model.ts:63-65,107-112`. Do not exclude it from `NON_SYNCING_TABLES`; if not syncing, add `public.<table>` to `NON_SYNCING_TABLES` (`database.js:281-292` throws; public schema only).
   - If pulled (`PULL_FROM_CENTRAL` or `BIDIRECTIONAL`): implement `buildSyncFilter` (return `null` if global) or `buildPatientSyncFilter` (enforced at init by `validateSync`, `Model.ts:114-130`). Pick the right builder: patient_id column, encounter path, note path or custom SQL (MDL-03). Reuse the generic builders.
   - If pulled: implement `buildSyncLookupQueryDetails` (not enforced by anything; a miss throws `TypeError` in the lookup build at `updateLookupTable.js:141`). Use `buildEncounterLinkedLookupFilter`/`buildEncounterLinkedLookupSelect` for encounter-linked data (enforced by `syncLookupFacilityScope.test.ts`), set `facilityId` only for genuinely facility-bound data, set `isLabRequestValue` only for lab data.
   - Soft delete only; no composite primary key without a stored generated `id` (MDL-10, MDL-11); make unique constraints and self-referencing FKs deferrable (`uniqueConstraintDeferrability.test.js`, `selfReferencingFkDeferrability.test.js`).
   - Migration creating the table: the post-migration hooks add the tick column and triggers (MDL-14), so do not add them by hand, but follow the DDL/DML split and backward-compatibility rules (`packages/database/CLAUDE.md`), update the dbt models, and add fake data (`llm/project-rules/coding-rules.md`).
   - Mobile (if the table should reach devices): TypeORM entity with `static syncDirection`, registered in `packages/mobile/App/models/modelsMap.ts`, and a mobile migration created with `npm run migrate-create` (`packages/database/CLAUDE.md`); mobile ledger MOB-16/17 notes new synced tables ask central to resend.
   - Sync-affecting model hooks: `incomingSyncHook` (batch via `config.sync.incomingSyncHookBatchSize`), `adjustDataPostSyncPush` (`Model.ts:43-46`), sanitisers (MDL-04).
   Obligations already in other rule files: migrations, dbt, mobile migration, fake data, reference-data provisioning in `llm/project-rules/coding-rules.md` (migrations and fake data sections) and `packages/database/CLAUDE.md`; settings placement in `llm/project-rules/settings.md`.
3. Reference data: MDL-05, MDL-06.
4. Users: MDL-02 and MDL-04. Yes, the whole row including the hash syncs to every facility and mobile device. No column other than the four bookkeeping ones is excluded for any model on the server; mobile excludes `filePath` for attachments. Only incoming sanitisers exist, and one outgoing-side row filter for mobile (sensitive surveys).
5. Hard deletes: MDL-09.
6. Primary keys and computed ids: MDL-10, MDL-11.
7. Hooks: MDL-14, MDL-15, MDL-16.
8. Migrations and sync: MDL-18, MDL-19, MDL-20.
9. Marking patients: MDL-21, MDL-22.
10. Settings table: MDL-24 (and MDL-27). Rollout flags flagged there.
11. Sensitive networks and the lab-request clause: MDL-30, MDL-31. In one line: the code admits every `is_lab_request` row to a `syncAllLabRequests` facility regardless of network or patient; the spec states that ordering explicitly; nothing excludes sensitive records when `is_lab_request` is populated.

## Not in the transcript

- Tests that pin model sync config: `packages/central-server/__tests__/sync/databaseState.test.js:19-44` (and the facility copy: "all changes applied here should be applied there as well") asserts syncing models have the tick attribute and non-syncing ones do not, except `sync_lookup`; `getModelsForDirection.test.ts`; deferrability tests (MDL-12); facility-scope test (MDL-31). No test asserts every pull model implements `buildSyncLookupQueryDetails`.
- A runtime constraint: a session covering facilities in more than one sensitive network throws (`CSM:552-556`).
- `PatientFacility` and many generated-id models: `saveUpdates` strips `id` from `SET` because a generated column cannot be written (`saveChanges.ts:64-78`), and creates are deduplicated by id because `syncAllLabRequests` can deliver an encounter twice (`saveChanges.ts:29-35`).
- `SurveyResponseAnswer` and `VitalLog` drop sensitive-survey answers for mobile at the pull filter, and mobile never sees them. This is separate from sensitive networks.
- The `User.ts:305` check `auth.restrictUsersToSync` controls whether a user is allowed to sync at all.
- `COLUMNS_EXCLUDED_FROM_SYNC` means `deletedAt` is never in a sync payload; deletion travels only as `isDeleted` on the snapshot row and is applied by the receiver (`saveChanges.ts:36-52`).

## Unresolved

- Whether `lab_test_panel_lab_test_types` has a generated `id` column, and the full set of composite-key tables on a live schema: read from migrations only, not from a database.
- The effect of the `sync.databasePollInterval` key mismatch (MDL-27): need to read `ReadSettings.get` for an unknown path.
- Whether the lab-request exception to network scoping is intended: spec states the ordering but not the confidentiality consequence; needs a product decision.
- Consequences of unmarking a patient: no code, spec or runbook answers; ask whoever did the one manual unmark.
- Which of `config` and settings wins for `tasks.syncLookupRefresher` schedule: both define it; I did not trace how `context.schedules` is assembled.
- Whether logs-schema `DO_NOT_SYNC` models (`logs.accesses`, `logs.changes`, `logs.migrations`) getting `updated_at_sync_tick` columns and triggers is intended; the baseline has them, the exclusion check skips non-public schemas.
