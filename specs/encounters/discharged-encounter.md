---
id: DSCHV
---

# Discharged encounter view

How the desktop client presents an encounter once it has been discharged: which actions the encounter view offers, and what the encounter record and discharge summary show. An encounter is discharged when it has an end date. Discharging through the app also creates a discharge record carrying the discharging clinician, disposition and discharge notes, but an encounter can be discharged without one (for example, encounters closed by the outpatient discharger on early versions), and the view treats both the same.

## Encounter actions

- [ ] An encounter with an end date offers **Encounter record** and **Discharge summary**, whether or not it has a discharge record.
- [ ] An encounter without an end date offers **Prepare discharge** and **Move patient**, with **Encounter progress record** in the actions menu.
- [ ] Vaccination and survey-response encounters offer no encounter actions; they hold a single record and are closed automatically.

## Discharge record

- [ ] The client reads an encounter's discharge record only for an encounter with an end date.
- [ ] A discharged encounter with no discharge record is presented as discharged, with the fields the record would have supplied left blank. No error is shown to the user.

## Encounter record

- [ ] The encounter record for an encounter with an end date is titled **Encounter record** and shows the date of discharge taken from the encounter's end date.
- [ ] The encounter record for an encounter without an end date is titled **Patient Encounter Progress Record** and shows the date of discharge as not applicable.
- [ ] The encounter record can be printed for a discharged encounter with or without a discharge record.

## Discharge summary

- [ ] The discharge summary renders for every encounter with an end date.
- [ ] The letterhead facility is the encounter's facility.
- [ ] When a discharge record exists, the summary shows its discharging clinician, discharge disposition and discharge notes.
- [ ] Diagnoses, procedures, medications selected for discharge, ongoing conditions, supervising clinician, department, admission date, discharge date and reason for encounter come from the encounter and the patient.
