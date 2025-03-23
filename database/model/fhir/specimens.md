{% docs fhir__table__specimens %}
FHIR data about specimen, for laboratory testing.

<https://www.hl7.org/fhir/specimen.html>
{% enddocs %}

{% docs fhir__specimens__collection %}
Who collected the specimen, from where, and at what time.
{% enddocs %}

{% docs fhir__specimens__request %}
Reference to the [service request](#!/source/source.tamanu.fhir__tamanu.service_requests) this
specimen is for.
{% enddocs %}

{% docs fhir__specimens__type %}
Coded type of the specimen.

These codes are from Reference Data `type=specimenType`.
{% enddocs %}
