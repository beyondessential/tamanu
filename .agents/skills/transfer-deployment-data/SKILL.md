---
name: transfer-deployment-data
description: "Copy data from one Tamanu deployment into another through their HTTP APIs: reference data, facilities and locations, users, programs and forms, settings, and chosen patients with their details, summaries, appointments and, for named patients, full clinical history. Use when asked to pull across, copy, migrate or mirror data from a deployment (e.g. 'bring the data from presentation.demos.tamanu.app into my PR deploy'). To create new data, use seed-demo-data. Never writes to the source, and never targets production."
label: "Transfer deployment data"
---

## Your task: transfer data between deployments

Copy data from a source Tamanu deployment into a target one, through their HTTP APIs. The source is only ever read.

**Read `.agents/docs/tamanu-api-access.md` first.** It covers why this is done through the API from a shell and never through a browser, how to log in to central and facility servers, the request helper, how to look up IDs, and the behaviours that catch people out. Stop straight away if you can't send HTTP requests from where you are.

### 1. Agree the transfer

Ask with your question tool where you have one, a few questions at a time; otherwise ask in prose. Ask only what the user hasn't already told you.

- **Source and target deployments.** Confirm the target is a demo, presentation, PR or test deployment, never production.
- **An admin login for each.** PR deployments use `admin@tamanu.io` / `admin`. Others need the password from the user.
- **What else to copy**, besides patients: reference data, facilities and locations, users, programs and forms, settings. Usually all of it.
- **Which patients, if any.** Offer:
  - **None**: the deployment's set-up only, with no patients.
  - **The most recently seen**, 100 by default: patients with the latest appointments or an open encounter at the source.
  - **Specific patients**, named by name and date of birth, or by patient ID.
  - **All patients**, only when the source is small.
- **How much of each patient's record.** Offer:
  - **Details only**: name, date of birth, sex, patient ID, contact and address.
  - **Details and summary**: also allergies, ongoing conditions, family history, issues, care plans, vaccinations, completed forms and appointments.
  - **Full clinical history**: also every encounter with its diagnoses, procedures, notes and forms. Offer this only for patients named individually, at most about ten, because each one is slow to rebuild (see step 5).
- **What's already on the target**, and whether copied records should update it or be left alone.

Restate it as a short plan before writing anything. For the most recently seen, list who that comes to (count and a few names) and confirm.

### 2. Choose the patients

- **Most recently seen:** on the source facility server, read appointments over a recent window, newest first (`GET /api/appointments?after=<90 days ago>&before=<now>&all=true&order=DESC`). Add the patients with an open encounter: the patient list *without* `isAllPatientsListing=true` returns exactly those. Keep each patient once, newest first, and stop at the agreed count.
- **Specific patients:** find each with `GET /api/patient?firstName=&lastName=&isAllPatientsListing=true`, or by patient ID with `displayId=`. Where a name matches more than one person, ask which.

Keep the chosen patients' IDs. Everything after this works from that list.

### 3. Copy the set-up with the admin spreadsheets

The admin export and import move most data as the same spreadsheets the admin panel uses. They keep each record's ID, so later records can refer to copied ones by their source IDs.

1. **Export from the source** (central):
   - Reference data and records: `GET /api/admin/export/referenceData?includedDataTypes[0]=<type>&includedDataTypes[1]=<type>...` downloads an `.xlsx`. Types include every reference data type, plus `facility`, `department`, `locationGroup`, `location`, `patient`, `user`, `administeredVaccine`, `labTestType`, `scheduledVaccine` and the invoicing types. The full list is `GENERAL_IMPORTABLE_DATA_TYPES` in `packages/constants/src/importable.ts`.
   - Programs and their forms: list them with `GET /api/admin/programs`, then `GET /api/admin/export/program/<programId>` for each.
   - A large export can be refused for size (the `export.maxFileSizeInMB` setting). Split it into a few types per file.
2. **Keep only the chosen patients.** The `patient` and `administeredVaccine` sheets export every patient. Remove the rows of patients you aren't copying before importing. To edit the workbook, use the `xlsx` package already in this repository (run your script from the repository so it resolves), or Python's `openpyxl` if it's available.
3. **Import into the target** (central), always as a dry run first:
   - `POST /api/admin/import/referenceData` or `POST /api/admin/import/program`, sent as `multipart/form-data` with the spreadsheet as `file` and the options as a JSON string in `jsonData`, e.g. `{"dryRun": true, "includedDataTypes": ["patient"]}`.
   - The response reports what would be created, updated and skipped, and any errors by sheet and row. Fix or drop what fails, then import for real without `dryRun`.
   - Import in dependency order: reference data; facilities and locations; users; programs; then patients and their vaccinations.

Two kinds of record need care:

- **Facilities.** The target's facility servers are configured for their own facility IDs, so importing the source's facilities doesn't make them usable. List the facilities on both sides. Where the IDs match (deployments provisioned from the same defaults often share `facility-1`, `locationgroup-Theatre1-tamanu` and so on), copy locations as they are. Where they don't, map each source facility to a target facility, and rewrite `facilityId` in the location and location group sheets before importing. Map facility IDs the same way for every record after this.
- **Users.** An export doesn't include passwords. Set a password in the sheet for anyone who needs to sign in. Users who only appear on records don't need one.

### 4. Copy each patient's details and summary

Once a sync has passed and the imported patients are on the target facility server, copy the rest of each chosen patient's record from the source facility server to the target facility server.

- **Contact, address and other details** aren't in the patient export: read `GET /api/patient/<id>/additionalData` and write the same fields with `PUT /api/patient/<id>`.
- **Allergies:** read `GET /api/patient/<id>/allergies`; create with `POST /api/allergy`.
- **Ongoing conditions:** read `GET /api/patient/<id>/conditions`; create with `POST /api/ongoingCondition`.
- **Family history, issues and care plans:** read `GET /api/patient/<id>/familyHistory`, `/issues` and `/carePlans`; create with `POST /api/familyHistory`, `POST /api/patientIssue` and `POST /api/patientCarePlan`.
- **Completed forms:** read `GET /api/patient/<id>/programResponses`, then each response with its answers from `GET /api/surveyResponse/<responseId>`. Recreate with `POST /api/surveyResponse` and `{ surveyId, patientId, startTime, endTime, answers, facilityId }`, where `answers` maps each question's data element ID to its stored answer. Without an `encounterId`, a response is filed under the patient's open encounter, or under a new encounter of its own. The forms must have been copied with their programs first.
- **Appointments:** read with `GET /api/appointments?patientId=<id>&after=<...>&before=<...>&all=true`. Recreate outpatient appointments with `POST /api/appointments` and `{ locationGroupId, appointmentTypeId, patientId, clinicianId, startTime, endTime, facilityId }`, then set the status if it isn't Confirmed (`PUT /api/appointments/<id>` with `{ status }`).
- **Location bookings** (theatres, beds): recreate with `POST /api/appointments/locationBooking` and `{ startTime, endTime, locationId, patientId, clinicianId, bookingTypeId, procedureTypeIds? }`. One that overlaps an existing booking in the same location is refused; skip it and report it.

For each kind of record, copy one first and read it back on the target before copying the rest. Leave `email` off appointments and bookings: it sends patients real reminders. Times copy unchanged when both deployments share a primary time zone (given at login); if they don't, convert them.

### 5. Copy full clinical history, for named patients only

This rebuilds a patient's past visits one record at a time. It's slow, and the copy is close to the original but not exact, so do it only for the patients the user named for it.

1. **Read the history** at the source: `GET /api/patient/<id>/encounters`, then for each encounter `GET /api/encounter/<encounterId>` and its parts: `/diagnoses`, `/procedures`, `/notes`, `/programResponses` (completed forms, including vitals), `/labRequests`, `/imagingRequests` and `/medications`.
2. **Recreate each encounter in date order** with `POST /api/encounter` and `{ encounterType, startDate, endDate, patientId, examinerId, locationId, departmentId, reasonForEncounter, facilityId }`. Include `endDate` for past encounters, so they're created already closed. A patient can only have one open encounter, so recreate any open one last. Keep a map of source encounter IDs to target encounter IDs.
3. **Recreate what happened in each encounter**, using the target encounter ID:
   - **Diagnoses:** `POST /api/diagnosis` with `{ encounterId, diagnosisId, certainty, isPrimary, date, clinicianId }`.
   - **Procedures:** `POST /api/procedure`, mirroring the source procedure's fields.
   - **Notes:** `POST /api/notes` with `{ recordType: "Encounter", recordId, noteTypeId, content, date, authorId }`.
   - **Completed forms and vitals:** `POST /api/surveyResponse` as in step 4, with the target `encounterId`. Copy these here rather than in step 4, so they stay with their encounters.
   - **Lab requests, imaging requests and prescriptions:** read the source records and recreate them with `POST /api/labRequest`, `POST /api/imagingRequest` and `POST /api/medication`, mirroring their fields. Lab results are recorded separately on each test. These records have the most linked data, so check one of each on the target before going further.
4. **Leave out** invoices, attached documents, tasks and anything else the user didn't ask for, and say so in the report.

### 6. Copy settings

Read each scope from the source with `GET /api/admin/settings?scope=global`, `scope=central` and `scope=facility&facilityId=<id>`. Copy across only what the user wants, merged into the target's settings, keyed by the target's facility IDs. Never copy secrets (they come back masked), and never copy anything tied to the source's own addresses or integrations, such as `patientPortal.baseUrl`.

### 7. Check it

Once a sync has passed, compare counts on both sides for each kind of record you copied: patients, users, locations, programs and surveys, appointments and bookings per day and place. For each patient with full history, compare their encounters, diagnoses and notes side by side. Open a few records on the target's facility server to confirm they read correctly.

### 8. Report

Summarise what was copied, grouped the way the user will check it (per facility, ward, theatre, day or patient), and what was skipped or failed and why. Include the target's addresses. If the user also wants new data on top, that's the `seed-demo-data` skill.
