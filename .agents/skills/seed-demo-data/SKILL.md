---
name: seed-demo-data
description: "Create new demo data in a Tamanu deployment through its HTTP API: patients, clinicians, appointments, theatre and bed bookings, allergies and conditions, reference data and settings. Use when asked to seed, add, set up or refresh demo data on a demo, presentation, PR or test deployment (e.g. 'book back-to-back theatre cases for next week' or 'add six surgical patients with appointments today'). To copy existing data from another deployment, use transfer-deployment-data. Not for production deployments."
label: "Seed demo data"
---

## Your task: seed demo data

Create the demo data the user describes in a Tamanu deployment, through its HTTP API.

**Read `.agents/docs/tamanu-api-access.md` first.** It covers why this is done through the API from a shell and never through a browser, how to log in to central and facility servers, the request helper, how to look up IDs, and the behaviours that catch people out. Stop straight away if you can't send HTTP requests from where you are.

### 1. Pin down what to create

Ask with your question tool where you have one, a few questions at a time; otherwise ask in prose. Ask only what the user hasn't already told you.

- **The deployment to write to.** Confirm it's a demo, presentation, PR or test deployment, never production.
- **The admin login.** PR deployments use `admin@tamanu.io` / `admin`. Others need the password from the user.
- **What to create.** For each kind of record, how many, on which days, at which facility and in which areas. Leave the realistic detail (times, lengths, procedure types) to you unless they specify it.
- **Which country the patients and clinicians should look like they're from**, before creating any. Offer the country the deployment serves (its facility names and existing patients usually show it) and a couple of other likely ones. Use it for everyone's names, a realistic mix of the country's communities, villages and towns, and the shape of addresses and phone numbers. Ask about anything else that sets the scene, such as the patients' age range or the clinical area (surgical, antenatal, chronic care).
- **Facility and location names**, if they should change too. Offer to keep them, rename them to fit the chosen country, or rename them to match a specific facility the demo is for. For a specific facility, use its real name and ask the user for its wards, theatres and clinics rather than guessing them; where they don't know, use names typical for a facility of that kind and say which you invented.

Restate it as a short plan before writing anything. When it's many records across days and places, give the counts per day and place so the user can catch a misunderstanding early.

### 2. Look up before you create

Log in to central and to the facility server, and scope the facility token to the facility. Then read what the plan needs: the facility's areas and locations, clinicians, appointment types, booking types, procedure types, and relevant settings such as `appointments.bookingSlots`, which sets the bookable hours and slot length. Use only IDs that exist. Where something the plan needs doesn't exist, create it (see below) or ask.

Check for what's already there, so a re-run doesn't duplicate it: existing patients by name and date of birth, existing appointments for that patient and day, existing bookings in that location and time.

### 3. Create

All on the facility server unless marked central.

- **Patients:** `POST /api/patient` with `{ patientRegistryType: "new_patient", facilityId, displayId, firstName, lastName, dateOfBirth, sex }`. Generate the `displayId` yourself. Give each patient a name, and later an address, that fits the country agreed in step 1, with no two patients alike. Set addresses and phone numbers afterwards with `PUT /api/patient/<id>`.
- **Clinicians** (central): create a role with no permissions (`POST /api/admin/role` with `{ id, name }`), then users with `POST /api/admin/users` and `{ displayName, email, role, password }`, using a name that fits the country agreed in step 1 and a long random password nobody needs to know. Clinicians who only appear on appointments don't need anything more. Wait for them to sync to the facility before using them there.
- **Outpatient appointments:** `POST /api/appointments` with `{ locationGroupId, appointmentTypeId, patientId, clinicianId, startTime, endTime, facilityId }`. They're created Confirmed. To change the status, `PUT /api/appointments/<id>` with `{ status }`, e.g. `"Arrived"`.
- **Theatre, bed and other location bookings:** `POST /api/appointments/locationBooking` with `{ startTime, endTime, locationId, patientId, clinicianId, bookingTypeId, procedureTypeIds? }`. Start and end on the booking slot boundaries. One that overlaps an existing booking in the same location is refused; skip that block and carry on.
- **Allergies:** `POST /api/allergy` with `{ patientId, allergyId, reactionId, recordedDate, practitionerId }`.
- **Ongoing conditions:** `POST /api/ongoingCondition` with `{ patientId, conditionId, recordedDate, examinerId }`.
- **Facility, department, area and location names** (central): rename them through the admin spreadsheets, as in "Renaming facilities, areas and locations" in the API doc. Do this first, so everything after it is booked into the renamed places.
- **Reference data** (central), such as a new appointment type: `POST /api/admin/referenceData/manage` with `{ referenceDataType, code, name }`.
- **Settings** (central): read the scope, change only the keys you mean to, and `PUT` the whole scope back.
- **Patient portal**, for a patient who should be able to sign in: turn on the global setting `features.patientPortal`, make sure `patientPortal.baseUrl` is set, then `POST /api/patient/<id>/portal/register` with `{ email, facilityId }`. The registration link and every login code go to that email, so use an inbox the user can read. To give them forms, `POST /api/patient/<id>/portal/forms` with `{ formId, assignedAt, facilityId }`.

Leave `email` off appointments and bookings: it sends patients real reminders.

### 4. Check it

Read back what you created and compare it with the plan: counts per day, place and patient, and nothing overlapping where it shouldn't. Where the demo shows something to patients or staff, check it through the endpoint that feature uses; for the self check-in kiosk, `GET /api/kiosk/appointments?lastName=&dateOfBirth=` on the facility should find each patient.

### 5. Report

Summarise what you created, grouped the way the user will check it (per facility, theatre, ward, day or patient), and anything skipped and why. Include the addresses to open. Point out anything that needs redoing before the demo, such as appointments that only count for today.
