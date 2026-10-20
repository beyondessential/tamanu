# Deterministic FHIR resource ids

Implements the [FHIR resource identifiers](../../../specs/fhir/resource-ids.md) spec (FRID): a materialised FHIR resource's `id` becomes a UUIDv5 derived from a frozen Tamanu namespace and the name `<FhirResourceType>/<upstreamId>`, instead of a random `gen_random_uuid()`.

The change is surgical: only the first-materialisation id-assignment branch changes. Existing rows keep their ids (found by `upstream_id` lookup), references are unchanged (still built by looking up the target's stored id), and there is no schema change — so no migration.

## Frozen namespace constant

- [x] Mint one UUID off-line (e.g. `node -e "console.log(crypto.randomUUID())"`) and add it to `@tamanu/constants` as `FHIR_RESOURCE_ID_NAMESPACE` in `packages/constants/src/fhir.ts`, with a comment that it is a frozen contract and must never change (changing it changes every deterministically-derived id). Value: `fa29f90a-e123-48d7-8538-8c98866df993`.
- [x] Confirm it is re-exported from `packages/constants/src/index.ts` (fhir.ts is already surfaced there).

## Deterministic id helper

> **Placement changed from the original plan.** `@tamanu/utils` is consumed by the web browser bundle, so it can't host this helper. It lives in the server-only `@tamanu/database` package instead, next to the materialiser. Only the frozen namespace constant stays in `@tamanu/constants`.
>
> **Implementation changed after CI.** UUIDv5 was first hand-rolled with `node:crypto` SHA-1 to avoid a new dependency, but CodeQL flagged the SHA-1 call (`js/weak-cryptographic-algorithm`). The alert is a false positive (SHA-1 is prescribed by RFC 4122 for v5 and derives an identifier from non-secret inputs), but inline `// codeql[...]` suppressions do nothing under CodeQL default setup, which this repo uses: they are only applied by the `advanced-security/dismiss-alerts` Action. The helper now delegates to the `uuid` package's reference `v5`, which removes the hand-rolled crypto from first-party code and clears the alert. Derived ids are unchanged, pinned by golden-value tests.

- [x] Add a `fhirResourceId(fhirResourceType, upstreamId)` helper returning `uuidv5(`${fhirResourceType}/${upstreamId}`, FHIR_RESOURCE_ID_NAMESPACE)` at `packages/database/src/utils/fhir/resourceId.ts`, importing the namespace from `@tamanu/constants`.
- [x] Delegate UUIDv5 to the `uuid` package's `v5`, added as a dependency of `packages/database/package.json` (`^14.0.2`, matching the version web already uses).
- [x] Export the helper from `packages/database/src/utils/fhir/index.ts` (reachable as `@tamanu/database/utils/fhir`).

## Wire into materialisation

- [x] In `packages/database/src/models/fhir/Resource.ts`, in `materialiseFromUpstream`, change the new-resource `build({ ... })` branch so `id` is `fhirResourceId(this.fhirName, id)` instead of `Sequelize.fn('gen_random_uuid')` (`this.fhirName` resolves to the subclass's FHIR type name, the same value already used for the table name).
- [x] Leave `versionId` as `Sequelize.fn('gen_random_uuid')` — it marks the version, not the identity.
- [x] Leave the `id` column's `defaultValue: Sequelize.fn('gen_random_uuid')` in `initResource()` in place — it remains the fallback for non-materialised inserts (inbound FHIR writes), which have no upstream record.
- [x] Confirm `MediciReport` (whose `fhirName` returns its class name) and every other `FhirResource` subclass flow through this same branch, so all materialised types get deterministic ids.

## Tests

- [x] Unit test for `fhirResourceId` at `packages/database/__tests__/utils/fhirResourceId.test.ts`: identical `(fhirResourceType, upstreamId)` yields the identical UUID; a different type or upstream id yields a different UUID; output is a syntactically valid v5 UUID; and four golden values pin the derivation so any change to the frozen contract fails loudly. **Passing (8/8).**
- [x] Materialisation id-stability + determinism test at `packages/central-server/__tests__/hl7fhir/materialised/DeterministicId.test.js`: materialise a Practitioner, assert `id === fhirResourceId('Practitioner', upstreamId)`; re-materialise and assert the `id` is unchanged; materialise a Patient and assert the same upstream id maps to different ids per type. **Written; not executed here — the central test DB needs Postgres credentials not available in this session.** Same base code path as the passing unit test.
- [x] MediciReport is covered by the uniform base path plus the helper unit test's type-variation cases, rather than its own heavy materialisation fixture.

## Out of scope (no change needed)

- [x] No database migration and no mobile (TypeORM) migration — the `id` column type is unchanged and existing rows are not rewritten.
- [x] No change to `packages/shared/src/services/fhirTypes/reference.js` or the `resolved`/`resolveUpstreams` pass — references continue to resolve to the target's stored `id`.
- [x] No dbt model change — no schema change.
