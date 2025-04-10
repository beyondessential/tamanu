{% docs fhir__table__service_requests %}
FHIR data about service requests, which cover both laboratories and imaging.

<https://www.hl7.org/fhir/servicerequest.html>
{% enddocs %}

{% docs fhir__service_requests__identifier %}
Two identifiers:

- The Tamanu internal UUID of the lab or imaging request.
- The Tamanu Display ID of the lab or imaging request.
{% enddocs %}

{% docs fhir__service_requests__status %}
The processing status of the request as a normalized string.

Possible values: `draft`, `active`, `on-hold`, `revoked`, `completed`, `entered-in-error`, `unknown`.
{% enddocs %}

{% docs fhir__service_requests__intent %}
The intent of the request.

This is meant to encode planned/proposed requests, but Tamanu doesn't yet have this concept, so it
is always the single value `order`.
{% enddocs %}

{% docs fhir__service_requests__category %}
The SNOMED category of the request.

- Always 363679005 for imaging
- Always 108252007 for laboratory
{% enddocs %}

{% docs fhir__service_requests__priority %}
The priority of the request, normalized.

Tamanu priorities are fully customisable, to accommodate a wide range of clinical practices.
However this means there is no obvious way to map priorities to the FHIR set. It is an
administrator's responsibility to ensure the set of priorities in a Tamanu deployment matches usage.
As a stopgap, Tamanu priorities which do not match one of the FHIR priorities (`routine`, `urgent`,
`asap`, `stat`) are encoded as `null`.
{% enddocs %}

{% docs fhir__service_requests__order_detail %}
Coded description of the order.

For imaging this is the areas to the imaged, for labs these are the tests to be run.
{% enddocs %}

{% docs fhir__service_requests__location_code %}
Name of the facility for the request.

This is the most precise location available taken from a number of sources relating to the request.
{% enddocs %}

{% docs fhir__service_requests__code %}
Coded description of the service requested.

For labs this is the code of a test panel, if available.
{% enddocs %}

{% docs fhir__service_requests__subject %}
Reference to the [patient](#!/source/source.tamanu.fhir__tamanu.patients) this service request
concerns.
{% enddocs %}

{% docs fhir__service_requests__requester %}
Reference to the [practitioner](#!/source/source.tamanu.fhir__tamanu.practitioners) who requested
this.
{% enddocs %}

{% docs fhir__service_requests__occurrence_date_time %}
When this request should be actioned, if available.
{% enddocs %}

{% docs fhir__service_requests__encounter %}
Reference to the [encounter](#!/source/source.tamanu.fhir__tamanu.encounters) this service request
concerns.
{% enddocs %}

{% docs fhir__service_requests__note %}
Any comments made about the request.

For imaging, this may be orientation notes or other clinically-relevant annotations.
{% enddocs %}

{% docs fhir__service_requests__specimen %}
Reference to an optional specimen attachment.
{% enddocs %}
