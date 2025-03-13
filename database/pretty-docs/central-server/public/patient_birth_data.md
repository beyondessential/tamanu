## patient_birth_data

Information about the birth of the patient, if their birth was recorded into Tamanu.

This is specifically data about the newborn, and only the birth-relevant data.
Other patient data is found in the normal tables i.e. `patients`, `patient_additional_data`, etc.

## patient_id

Reference to the `patient`.

There is at most one `patient_birth_data` row per patient.

Note that the `id` column is generated from this column to enforce this.

## birth_weight

Weight in kg at birth.

## birth_length

Length in cm at birth.

## birth_delivery_type

Type of delivery.

One of:
- `normal_vaginal_delivery`
- `breech`
- `emergency_c_section`
- `elective_c_section`
- `vacuum_extraction`
- `forceps`
- `other`

## gestational_age_estimate

Gestational age estimate (weeks).

## apgar_score_one_minute

`Apgar score` one minute after birth.

## apgar_score_five_minutes

`Apgar score` five minutes after birth.

## apgar_score_ten_minutes

`Apgar score` ten minutes after birth.

## time_of_birth

Datetime of birth.

## birth_type

`single` or `plural` birth.

## attendant_at_birth

The type of the attendant at birth.

One of:
- `doctor`
- `midwife`
- `nurse`
- `traditional_birth_attentdant`
- `other`

## name_of_attendant_at_birth

Name of attendant at birth.

## birth_facility_id

Reference to the `facility` the birth was recorded at.

This is only required when `registered_birth_place` is `health_facility`.

## registered_birth_place

Type of the actual birth place.

One of:
- `health_facility`
- `home`
- `other`

## time_of_birth_legacy

[Deprecated] Time of birth.

