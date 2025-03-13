## logs.table.fhir_writes

Full-request logs of writes (creates and modifies) coming over the FHIR API.

FHIR is an extensive standard and we current support a small subset of it. There's an even tinier
subset of that which supports writes instead of just reads and searches. To avoid missing or losing
data which we could support accepting as writes in the future, and for development purposes, this
table logs the full request bodies for FHIR endpoints. This is not just the endpoints that we
currently support, but all incoming write requests.

## fhir_writes.id

UUID

## fhir_writes.created_at

When Tamanu received the request.

## fhir_writes.verb

HTTP verb (GET, POST, etc)

## fhir_writes.url

HTTP URL

## fhir_writes.body

Full request body

## fhir_writes.headers

Selected request headers.

Some headers are stripped for sensitivity.

## fhir_writes.user_id

The authenticated user for the API request.

