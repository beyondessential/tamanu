## administered_vaccines

Table of vaccines administered to patients.

Vaccinations are recorded via the Vaccinations modal; they are selected
from a list of Scheduled Vaccines and linked to a Patient via an Encounter.

## id

Tamanu identifier for vaccine administrations recorded

## batch

Batch identifier of vaccine administrations recorded

## status

Status of vaccine administrations recorded. 

The `RECORDED_IN_ERROR` status is assigned to vaccines initially recorded
as `GIVEN` that are then deleted.

The `HISTORICAL` status is assigned to vaccines initially recorded as 
`NOT_GIVEN` that are then recorded as `GIVEN`. This `HISTORICAL` status 
keeps a record that the vaccine was marked as `NOT_GIVEN` but hides this
record from the frontend to avoid confusion or conflict with the `GIVEN`
record.

## reason

Reason for vaccine administrations `NOT_GIVEN` status. This is a free text field

## injection_site

Injection site of the vaccine administrations recorded

## consent

Consent of the vaccine administrations recorded

## given_elsewhere

Checks if the vaccine was given elsewhere

## vaccine_name

Vaccine name of the vaccine administration recorded

## scheduled_vaccine_id

Reference to the `Scheduled Vaccine` that was
administered.

## encounter_id

Reference to the `Encounter` this vaccine was given in.

## vaccine_brand

Vaccine brand of the vaccine administration recorded

## disease

Disease the vaccine addresses of the vaccine administration recorded

## recorder_id

Reference to the `User` who recorded this vaccination.
This may differ from the User or person who administered the vaccine.

## location_id

Reference to the `Location` at which the vaccine was
given.

## department_id

Reference to the `Department` at which the vaccine was
given.

## given_by

Free text field for the name of the health practitioner who administered the
vaccine. This is defaulted to the `display_name` of the logged-in User, but can
be changed. It is not a requirement that the administerer is a Tamanu User.

## consent_given_by

Free text field recording who gave consent for the vaccination.
This is usually the patient themselves, but may differ for children or dependent
persons or other cases.

## not_given_reason_id

Reference to a `Reference Data (vaccineNotGivenReason)`.

These are presented as a dropdown for ease of recording and reporting, alongside the free-text field.

## circumstance_ids

Array of references to `Reference Data (vaccineCircumstance)`.

