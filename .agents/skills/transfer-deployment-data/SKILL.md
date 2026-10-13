---
name: transfer-deployment-data
description: "Copy data from one Tamanu deployment into another through their HTTP APIs: reference data, facilities and locations, patients, users, programs and forms, appointments and bookings, and settings. Use when asked to pull across, copy, migrate or mirror data from a deployment (e.g. 'bring the data from presentation.demos.tamanu.app into my PR deploy'). To create new data, use seed-demo-data. Never writes to the source, and never targets production."
label: "Transfer deployment data"
---

## Your task: transfer data between deployments

Copy data from a source Tamanu deployment into a target one, through their HTTP APIs. The source is only ever read.

**Read `.agents/docs/tamanu-api-access.md` first.** It covers why this is done through the API from a shell and never through a browser, how to log in to central and facility servers, the request helper, how to look up IDs, and the behaviours that catch people out. Stop straight away if you can't send HTTP requests from where you are.

### 1. Agree the transfer

Get from the user, asking only for what's missing:

- **The source and target deployments.** Confirm the target is a demo, presentation, PR or test deployment, never production.
- **An admin login for each.** PR deployments use `admin@tamanu.io` / `admin`. Others need the password from the user.
- **What to copy.** "Most of the data" usually means reference data, facilities and locations, patients, users, programs and forms, appointments and location bookings, and some settings. Clinical history (encounters, notes, lab and imaging requests) has no copy path here; if it's wanted, say so.
- **What's already on the target**, and whether copied records should update it or leave it alone.

Restate it as a short plan before writing anything.

### 2. Copy in bulk with the admin spreadsheets

The admin export and import move most data as the same spreadsheets the admin panel uses. They keep each record's ID, so records copied this way can be referred to by their source IDs afterwards.

1. **Export from the source** (central):
   - Reference data and records: `GET /api/admin/export/referenceData?includedDataTypes[0]=<type>&includedDataTypes[1]=<type>...` downloads an `.xlsx`. Types include every reference data type, plus `facility`, `department`, `locationGroup`, `location`, `patient`, `user`, `administeredVaccine`, `labTestType`, `scheduledVaccine` and the invoicing types. The full list is `GENERAL_IMPORTABLE_DATA_TYPES` in `packages/constants/src/importable.ts`.
   - Programs and their forms: list them with `GET /api/admin/programs`, then `GET /api/admin/export/program/<programId>` for each.
   - A large export can be refused for size (the `export.maxFileSizeInMB` setting). Split it into a few types per file.
2. **Import into the target** (central), always as a dry run first:
   - `POST /api/admin/import/referenceData` or `POST /api/admin/import/program`, sent as `multipart/form-data` with the spreadsheet as `file` and the options as a JSON string in `jsonData`, e.g. `{"dryRun": true, "includedDataTypes": ["patient"]}`.
   - The response reports what would be created, updated and skipped, and any errors by sheet and row. Fix or drop what fails, then import for real without `dryRun`.
   - Import in dependency order: reference data, then facilities and locations, then users and patients, then programs, so every record finds what it refers to.

Two kinds of record need care:

- **Facilities.** The target's facility servers are configured for their own facility IDs, so importing the source's facilities doesn't make them usable. List the facilities on both sides. Where the IDs match (deployments provisioned from the same defaults often share `facility-1`, `locationgroup-Theatre1-tamanu` and so on), copy locations as they are. Where they don't, map each source facility to a target facility, and rewrite `facilityId` in the location and location group sheets before importing.
- **Users.** An export doesn't include passwords. Set a password in the sheet for anyone who needs to sign in. Users who only appear on records don't need one.

### 3. Copy the rest through the API

Records with no spreadsheet are read from the source facility server and created on the target facility server, referring to the records the import copied by their source IDs. Map facility IDs the same way as in step 2.

- **Appointments:** read with `GET /api/appointments?after=<...>&before=<...>&all=true`. Recreate outpatient appointments with `POST /api/appointments` and `{ locationGroupId, appointmentTypeId, patientId, clinicianId, startTime, endTime, facilityId }`, then set the status if it isn't Confirmed (`PUT /api/appointments/<id>` with `{ status }`).
- **Location bookings** (theatres, beds): recreate with `POST /api/appointments/locationBooking` and `{ startTime, endTime, locationId, patientId, clinicianId, bookingTypeId, procedureTypeIds? }`. One that overlaps an existing booking in the same location is refused; skip it and report it.
- **Allergies and ongoing conditions:** read a patient's with `GET /api/patient/<id>/allergies` and `GET /api/patient/<id>/conditions`. Recreate with `POST /api/allergy` and `POST /api/ongoingCondition`.

Leave `email` off appointments and bookings: it sends patients real reminders. Times copy across unchanged when both deployments share a primary time zone (given at login); if they don't, convert them.

### 4. Copy settings

Read each scope from the source with `GET /api/admin/settings?scope=global`, `scope=central` and `scope=facility&facilityId=<id>`. Copy across only what the user wants, merged into the target's settings, keyed by the target's facility IDs. Never copy secrets (they come back masked), and never copy anything tied to the source's own addresses or integrations, such as `patientPortal.baseUrl`.

### 5. Check it

Once a sync has passed, compare counts on both sides for each kind of record you copied: patients, users, locations, programs and surveys, appointments and bookings per day and place. Open a few records on the target's facility server to confirm they read correctly.

### 6. Report

Summarise what was copied, grouped the way the user will check it (per facility, ward, theatre or day), and what was skipped or failed and why. Include the target's addresses. If the user also wants new data on top, that's the `seed-demo-data` skill.
