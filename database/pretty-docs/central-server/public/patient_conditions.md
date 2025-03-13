## patient_conditions

List of ongoing conditions known about a patient.

In Tamanu this is displayed and entered in the patient view sidebar, under "Ongoing conditions".

See also: `public.patient_allergies`, `public.patient_care_plans`,
`public.patient_family_histories`, `public.patient_issues`.

## note

Free-form description of this condition.

## recorded_date

Datetime at which this issue was recorded.

## resolved

Whether the condition has resolved.

## patient_id

Reference to the `patient`.

## examiner_id

Reference to the `practitioner` diagnosing/recording this
condition.

## condition_id

Reference to a diagnosis describing this issue (`Reference Data`).

## recorded_date_legacy

[Deprecated] Timestamp at which this issue was recorded.

## resolution_date

Datetime at which this issue was resolved.

## resolution_practitioner_id

Reference to the `practitioner` diagnosing/recording the
resolution of this condition.

## resolution_note

Free-form description or notes about the resolution of this condition.

