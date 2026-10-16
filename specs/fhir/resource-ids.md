---
id: FRID
---

# FHIR resource identifiers

The `id` of a materialised FHIR resource is derived deterministically from the resource type and the upstream record it materialises from. The same resource type and upstream id always produce the same FHIR id, so a given upstream record resolves to the same FHIR resource id on every server and across deployments.

This covers only resources materialised from an upstream Tamanu record (those carrying an `upstream_id`). It does not govern the `versionId` or resources created through inbound FHIR writes.

## Deterministic derivation

- [ ] A materialised FHIR resource's `id` is a UUID version 5 (RFC 4122, SHA-1 name-based), so it is a valid UUID that satisfies the resource's `id` column and FHIR's identifier format.
- [ ] The UUIDv5 is computed from a single fixed Tamanu FHIR namespace UUID and a name string of the form `<FhirResourceType>/<upstreamId>` — for example `Patient/<upstreamId>`.
- [ ] The resource-type component is the resource's FHIR type name (`Patient`, `Encounter`, `ServiceRequest`, and so on, and `MediciReport` for the non-FHIR materialised report).
- [ ] Every materialised resource type derives its id this way, including `MediciReport` and other non-FHIR materialised reports.
- [ ] The namespace UUID, the name format, and the resource-type names are a frozen contract: the same inputs must always yield the same id, so these inputs do not change once in use.

## Assignment and stability

- [ ] A resource materialised from an upstream record for the first time is assigned its deterministic id at creation.
- [ ] Re-materialising an upstream record resolves to the same resource row and leaves its `id` unchanged.
- [ ] A resource's `versionId` is a fresh value on each materialisation and is not derived from the upstream record — it marks the version, not the identity.
- [ ] Only one FHIR resource of a given type exists per upstream record.

## Existing resources

- [ ] FHIR resources already materialised with a non-deterministic id keep that id; deterministic derivation applies to resources materialised for the first time from this behaviour onward.
- [ ] References between FHIR resources resolve to the target resource's stored `id` as it exists, whether that id is deterministic or an earlier non-deterministic one.
