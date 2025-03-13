## patient_program_registrations

Table with information about the program registrations of a patient. This is helpful
to enroll a specific patient within a program that will be followed for an extended
period of time.

**This table is append-only.**
A new record is created every time there is a change to the status of a registration. 

At the moment, this implies that when merging two patients, both with a registration to the same
registry, the merged patient ends up with two registrations.

## registration_status

The current status of the registration.

One of:
- `active`
- `inactive`
- `recordedInError`

## patient_id

Reference to the `Patient`.

## program_registry_id

Reference to the `Program Registry`
of the registration.

## clinical_status_id

Reference to the `Program Registry Clinical Status`
of the registration.

## clinician_id

Reference to the `Clinician` recording that
registration.

## registering_facility_id

Reference to the `Facility` where the
registration was registered in.

## facility_id

Reference to the `Facility` this program
registration is from.

## village_id

Reference to the `Reference Data (village)` this program registration is from.

## is_most_recent

A boolean that represents whether this is the most recent registration for this
specific program registry.

