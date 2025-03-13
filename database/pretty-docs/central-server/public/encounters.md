## encounters

Tracks the basic information of the patient encounters within Tamanu from start to finish

## encounter_type

The type of the encounter.

One of:
- `admission`
- `clinic`
- `imaging`
- `emergency`
- `observation`
- `triage`
- `surveyResponse`
- `vaccination`

## start_date

The beginning of the encounter

## end_date

The date encounter was discharged/ended

## reason_for_encounter

Free-form information about the encounter.

Can include info like type of survey submitted, emergency diagnosis, etc.

## device_id

Unique identifier for the device that created the encounter.

Device IDs are proper to each device and not globally recorded in e.g. a `devices` table.

## start_date_legacy

[Deprecated] Start date.

## end_date_legacy

[Deprecated] End date.

## planned_location_id

The `location` that the encounter will transfer to at the
`planned_location_start_time`.

## patient_id

Reference to the `patient`.

## examiner_id

Reference to the `examiner`.

## location_id

Reference to the current `location` this encounter is in.

## department_id

Reference to the `department` this encounter is in.

## planned_location_start_time

The time that the encounter will transfer to the planned location.

## patient_billing_type_id

The billing type (`Reference Data`) of the patient.

## referral_source_id

The referral source (`Reference Data`) of the patient.

## discharge_draft

Draft data of the encounter

