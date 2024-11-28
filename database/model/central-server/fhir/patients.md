{% docs fhir__table__patients %}
FHIR data about patients.

<https://www.hl7.org/fhir/patient.html>
{% enddocs %}

{% docs fhir__patients__identifier %}
One or more identifiers for a patient:

- Tamanu Display ID or NHN (always)
- Passport number (if present)
- Driving licence number (if present)
{% enddocs %}

{% docs fhir__patients__active %}
Whether this patient record is in active use.

This is computed from the `visibility_status` and `deleted_at` columns on `public.patients`.
{% enddocs %}

{% docs fhir__patients__name %}
One or more names:

- the patient's official name (always)
- the patient's cultural name or nickname (if present)
{% enddocs %}

{% docs fhir__patients__telecom %}
Phone numbers for the patient, if available.
{% enddocs %}

{% docs fhir__patients__gender %}
Gender marker.

This is usually `male` or `female`, but may be something else if other values are allowed in Tamanu.
{% enddocs %}

{% docs fhir__patients__birth_date %}
Date of birth for the patient.

Generally present but not guaranteed.
{% enddocs %}

{% docs fhir__patients__deceased_date_time %}
Date of death, if deceased.
{% enddocs %}

{% docs fhir__patients__address %}
Home address for the patient, if available.
{% enddocs %}

{% docs fhir__patients__link %}
If the resource is for a merged or mergee patient record, this will link other instances of the patient.

A record that:

- was merged into another record, will have a `type=replaced-by` link;
- has records that were merged into it, will have one or more `type=replaces` links;
- has records that were merged into _ancestors_, will have one or more `type=seealso` links.
{% enddocs %}

{% docs fhir__patients__extension %}
If enabled, the ethnicity of the patient, as per the New Zealand FHIR ethnicity extension or
derivations thereof: <https://build.fhir.org/ig/HL7NZ/nzbase/branches/master/StructureDefinition-nz-ethnicity.html>.
{% enddocs %}
