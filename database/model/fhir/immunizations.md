{% docs fhir__table__immunizations %}
FHIR data about immunization (vaccines).

Currently this resource is focused around COVID-19 use.

These are materialised from `public.administered_vaccines`.

<https://www.hl7.org/fhir/immunization.html>
{% enddocs %}

{% docs fhir__immunizations__status %}
Normalized status code for the vaccination.

Tamanu has a larger set of values for vaccine status than FHIR, so a reduced mapping is done. One of:

- completed
- entered-in-error
- not-done
{% enddocs %}

{% docs fhir__immunizations__vaccine_code %}
The name of the vaccine drug given, optionally accompanied by a coding for select medicines.

A subset of [the AIRV register](https://www.healthterminologies.gov.au/integration/R4/fhir/ValueSet/australian-immunisation-register-vaccine-1) is supported.
{% enddocs %}

{% docs fhir__immunizations__patient %}
Reference to the [patient](#!/source/source.tamanu.fhir__tamanu.patients) to whom this vaccination
concerns.
{% enddocs %}

{% docs fhir__immunizations__encounter %}
Reference to the [encounter](#!/source/source.tamanu.fhir__tamanu.encounters) encompassing this
vaccination event.

In Tamanu, vaccinations can be given outside of an open encounter; this is encoded as an encounter
being recorded solely for the one vaccination, and immediately closed.
{% enddocs %}

{% docs fhir__immunizations__occurrence_date_time %}
Timestamp recording when the vaccine was given.
{% enddocs %}

{% docs fhir__immunizations__lot_number %}
Lot number of the vaccine vial.
{% enddocs %}

{% docs fhir__immunizations__site %}
Body area where the vaccine was given.
{% enddocs %}

{% docs fhir__immunizations__performer %}
Reference to the [practitioner](#!/source/source.tamanu.fhir__tamanu.users) who administered the
vaccination.
{% enddocs %}

{% docs fhir__immunizations__protocol_applied %}
Label of the vaccine dose given.
{% enddocs %}
