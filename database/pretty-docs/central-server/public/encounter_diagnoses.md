## encounter_diagnoses

Records diagnoses made during an encounter

## certainty

The level of certainty of the recorded diagnosis.

One of:
- `confirmed`
- `disproven`
- `emergency`
- `error`
- `suspected`

`disproven` and `error` are excluded for reporting

## is_primary

A boolean indicating if this is a primary diagnosis

## encounter_id

Reference to the `encounter` this diagnosis is for.

## diagnosis_id

The diagnosis (`Reference Data`).

## clinician_id

Reference to the `clinician` recording that diagnosis.

