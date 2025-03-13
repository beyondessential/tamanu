## fhir.table.immunizations

FHIR data about immunization (vaccines).

Currently this resource is focused around COVID-19 use.

These are materialised from `public.administered_vaccines`.

<https://www.hl7.org/fhir/immunization.html>

## immunizations.status

Normalized status code for the vaccination.

Tamanu has a larger set of values for vaccine status than FHIR, so a reduced mapping is done. One of:

- completed
- entered-in-error
- not-done

## immunizations.vaccine_code

The name of the vaccine drug given, optionally accompanied by a coding for select medicines.

A subset of `the AIRV register` is supported.

## immunizations.patient

Reference to the `patient` to whom this vaccination
concerns.

## immunizations.encounter

Reference to the `encounter` encompassing this
vaccination event.

In Tamanu, vaccinations can be given outside of an open encounter; this is encoded as an encounter
being recorded solely for the one vaccination, and immediately closed.

## immunizations.occurrence_date_time

Timestamp recording when the vaccine was given.

## immunizations.lot_number

Lot number of the vaccine vial.

## immunizations.site

Body area where the vaccine was given.

## immunizations.performer

Reference to the `practitioner` who administered the
vaccination.

## immunizations.protocol_applied

Label of the vaccine dose given.

