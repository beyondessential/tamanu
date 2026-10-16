# Deterministic FHIR resource ids

Implements the [FHIR resource identifiers](../../../specs/fhir/resource-ids.md) spec (FRID): a materialised FHIR resource's `id` becomes a UUIDv5 derived from a frozen Tamanu namespace and the name `<FhirResourceType>/<upstreamId>`, instead of a random `gen_random_uuid()`.

The change is surgical: only the first-materialisation id-assignment branch changes. Existing rows keep their ids (found by `upstream_id` lookup), references are unchanged (still built by looking up the target's stored id), and there is no schema change — so no migration.

## Frozen namespace constant

- [ ] Mint one UUID off-line (e.g. `node -e "console.log(crypto.randomUUID())"`) and add it to `@tamanu/constants` as `FHIR_RESOURCE_ID_NAMESPACE` in `packages/constants/src/fhir.ts`, with a comment that it is a frozen contract and must never change (changing it changes every deterministically-derived id).
- [ ] Confirm it is re-exported from `packages/constants/src/index.ts` (fhir.ts is already surfaced there).

## Deterministic id helper

- [ ] Add a `fhirResourceId(fhirName, upstreamId)` helper to `@tamanu/utils` that returns `uuidv5(`${fhirName}/${upstreamId}`, FHIR_RESOURCE_ID_NAMESPACE)`, importing the namespace from `@tamanu/constants`.
- [ ] Add the `uuid` package as a dependency of `packages/utils/package.json` and import `{ v5 as uuidv5 }` from it. (Alternative: implement UUIDv5 directly with `node:crypto` SHA-1 to avoid the dependency — the `uuid` package is the simpler, battle-tested path.)
- [ ] Export the helper from the `@tamanu/utils` entrypoint so `@tamanu/database` can import it.

## Wire into materialisation

- [ ] In `packages/database/src/models/fhir/Resource.ts`, in `materialiseFromUpstream`, change the new-resource `build({ ... })` branch so `id` is `fhirResourceId(this.fhirName, id)` instead of `Sequelize.fn('gen_random_uuid')` (`this.fhirName` resolves to the subclass's FHIR type name, the same value already used for the table name).
- [ ] Leave `versionId` as `Sequelize.fn('gen_random_uuid')` — it marks the version, not the identity.
- [ ] Leave the `id` column's `defaultValue: Sequelize.fn('gen_random_uuid')` in `initResource()` in place — it remains the fallback for non-materialised inserts (inbound FHIR writes), which have no upstream record.
- [ ] Confirm `MediciReport` (whose `fhirName` returns its class name) and every other `FhirResource` subclass flow through this same branch, so all materialised types get deterministic ids.

## Tests

- [ ] Unit test for `fhirResourceId` in `@tamanu/utils`: identical `(fhirName, upstreamId)` yields the identical UUID; a different type or a different upstream id yields a different UUID; output is a syntactically valid v5 UUID.
- [ ] Materialisation id-stability test in `packages/central-server/__tests__/hl7fhir/materialised/` (extend `resolver.test.js` or add a focused file): materialise an upstream record, capture `id`, re-materialise, assert the `id` is unchanged.
- [ ] Determinism assertion in the same area: assert a freshly materialised resource's `id` equals `fhirResourceId(Resource.fhirName, upstreamId)` for a representative resource (e.g. Patient) and for `MediciReport`, pinning the cross-server-reproducible derivation.

## Out of scope (no change needed)

- [ ] No database migration and no mobile (TypeORM) migration — the `id` column type is unchanged and existing rows are not rewritten.
- [ ] No change to `packages/shared/src/services/fhirTypes/reference.js` or the `resolved`/`resolveUpstreams` pass — references continue to resolve to the target's stored `id`.
- [ ] No dbt model change — no schema change.
