## patients

The central record for a patient.

⚠️ The full contents of this table are synced to all devices, and in larger deployments this may be
hundreds of thousands of records (or even millions), so it is critical to keep the row size small.

Only contains basic patient data (name, dob, etc.): the bare minimum to be able to find that patient
in the system from the search page.

The remainder of the patient data is stored in the `patient_additional_data` table, which is only
synced to a device once it has marked that patient for sync (in the `patient_facility` table).

## display_id

Tamanu identifier for patients that is used on the front-end to refer to a patient.

It is usually the primary "health system" ID for this patient (ie something like a medicare number,
national healthcare number, etc), and may be imported from an external system or allocated by Tamanu
itself.

Informally this is called NHN or "Display ID" interchangeably.

Additional external IDs are tracked in the `patient_secondary_ids` table.

## first_name

First name of patient

## middle_name

Middle name of patient

## last_name

Last name of patient

## cultural_name

Cultural name of patient

## email

Email address of patient

## date_of_birth

Date of birth of patient

## sex

Sex of patient.

One of:
- `male`
- `female`
- `other`

## village_id

Tamanu village identifier defined in the reference data

## additional_details

[Deprecated] Additional details of the patient

## merged_into_id

Tamanu identifier for the patient the patient record was merged into

## date_of_death_legacy

[Deprecated] Timestamp of death of patient

## date_of_death

Date and time of death of patient

## date_of_birth_legacy

[Deprecated] Timestamp of birth of patient

