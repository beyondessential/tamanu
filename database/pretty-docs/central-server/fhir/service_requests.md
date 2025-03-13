## fhir.table.service_requests

FHIR data about service requests, which cover both laboratories and imaging.

<https://www.hl7.org/fhir/servicerequest.html>

## service_requests.identifier

Two identifiers:

- The Tamanu internal UUID of the lab or imaging request.
- The Tamanu Display ID of the lab or imaging request.

## service_requests.status

The processing status of the request as a normalized string.

Possible values: `draft`, `active`, `on-hold`, `revoked`, `completed`, `entered-in-error`, `unknown`.

## service_requests.intent

The intent of the request.

This is meant to encode planned/proposed requests, but Tamanu doesn't yet have this concept, so it
is always the single value `order`.

## service_requests.category

The SNOMED category of the request.

- Always 363679005 for imaging
- Always 108252007 for laboratory

## service_requests.priority

The priority of the request, normalized.

Tamanu priorities are fully customisable, to accommodate a wide range of clinical practices.
However this means there is no obvious way to map priorities to the FHIR set. It is an
administrator's responsibility to ensure the set of priorities in a Tamanu deployment matches usage.
As a stopgap, Tamanu priorities which do not match one of the FHIR priorities (`routine`, `urgent`,
`asap`, `stat`) are encoded as `null`.

## service_requests.order_detail

Coded description of the order.

For imaging this is the areas to the imaged, for labs these are the tests to be run.

## service_requests.location_code

Name of the facility for the request.

This is the most precise location available taken from a number of sources relating to the request.

## service_requests.code

Coded description of the service requested.

For labs this is the code of a test panel, if available.

## service_requests.subject

Reference to the `patient` this service request
concerns.

## service_requests.requester

Reference to the `practitioner` who requested
this.

## service_requests.occurrence_date_time

When this request should be actioned, if available.

## service_requests.encounter

Reference to the `encounter` this service request
concerns.

## service_requests.note

Any comments made about the request.

For imaging, this may be orientation notes or other clinically-relevant annotations.

## service_requests.specimen

Reference to an optional specimen attachment.

