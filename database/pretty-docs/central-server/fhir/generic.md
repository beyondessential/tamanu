## fhir.generic.schema

Contains materialised FHIR resources.

FHIR resources in Tamanu are generated ("materialised") from the source tables in the public schema.
This materialisation process collapses the relational database model into a flatter hierarchical
resource model, according to the FHIR specification. Tamanu's FHIR API is then implemented as a thin
query and presentation layer on top of this materialised data. Every top-level field in a FHIR
resource that we support is expressed as a column in the corresponding FHIR resource table. Scalar
data is expressed directly, and complex data is encoded as JSONB.

## generic.id

FHIR resource identifier

## generic.version_id

FHIR resource version identifier

This is not currently used in any way.

## generic.upstream_id

Identifier of the row in the public schema that is the upstream source of this FHIR resource

## generic.last_updated

Timestamp of when this FHIR resource was last materialised.

## generic.is_live

Whether or not a FHIR resource is live. If a resource is not live, it won't be rematerialised if upstream changes are made.

## generic.resolved

If this FHIR resource has resolved all of its references to other resources.

