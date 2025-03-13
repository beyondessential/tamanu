## fhir.table.encounters

FHIR data about encounters.

"Encounter" means an interaction between a patient and a healthcare provider, for health services or
when assessing the health status of the patient. Encounters are in the present and the past; future
interactions are typically called "Appointments."

These are materialised from `public.encounters`.

<https://www.hl7.org/fhir/encounter.html>

## encounters.status

The status of the encounter.

In Tamanu this can be one of two values:

- in-progress (for current or open encounters)
- discharged

## encounters.class

The general classification of the encounter.

This is a complex type but in Tamanu represents only one of these three classes (or absent):

- IMP (inpatient)
- EMER (emergency)
- OBSENC (observation)

## encounters.actual_period

The start and end (if present) dates of the encounter.

## encounters.subject

Reference to the `patient` involved in the encounter.

## encounters.location

The location of the encounter.

This is a complex type which encodes many bits of information about the location, such as its name
and internal ID, physical type, and status. Additionally there are two locations per encounter, one
describing the ward or general hospital area, and one describing the bed or specific place within
that area.

## encounters.service_provider

Reference to the `facility` where the encounter is
taking place.

