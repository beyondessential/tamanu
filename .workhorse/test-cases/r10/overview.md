# Deterministic FHIR resource ids — test cases

Scenarios verifying that a materialised FHIR resource's id is derived deterministically from its resource type and upstream id (spec: FRID). Ticked cases are covered by an automated test; unticked cases remain owed coverage.

## Derivation (helper)

- [x] The same resource type and upstream id always produce the same id (verifies spec: FRID).
- [x] A different upstream id produces a different id (verifies spec: FRID).
- [x] A different resource type with the same upstream id produces a different id (verifies spec: FRID).
- [x] The derived id is a syntactically valid version-5 UUID, usable in the `uuid` id column (verifies spec: FRID).
- [x] Known inputs derive known ids (golden values), pinning the frozen namespace, name format and UUID version against accidental change (verifies spec: FRID).

## Materialisation

- [ ] A resource materialised from an upstream record for the first time is assigned `fhirResourceId(type, upstreamId)` (verifies spec: FRID).
- [ ] Re-materialising the same upstream record leaves the id unchanged (verifies spec: FRID).
- [ ] The same assignment holds for `MediciReport` when materialised from its upstream report (verifies spec: FRID).
- [ ] `versionId` changes on re-materialisation while `id` stays fixed (verifies spec: FRID).

## Cross-server reproducibility

- [ ] The same upstream record materialised independently on central and facility servers yields the same FHIR id (verifies spec: FRID).

> Note: the ticked Derivation cases are covered and passing via the DB-free unit test (`packages/database/__tests__/utils/fhirResourceId.test.ts`). The Materialisation cases are written in `packages/central-server/__tests__/hl7fhir/materialised/DeterministicId.test.js` but stay unticked because that suite needs the central test database, which requires Postgres credentials unavailable so far. The cross-server case has no automated test yet.
