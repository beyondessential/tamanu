# U6 — Sensitive network schema and migration of existing sensitive facilities

Data model only. Spec: `specs/sync/sensitive-networks.md`.

## Decisions taken during specification

**The backfill gives each existing sensitive facility its own network of one**, not one shared
network as the PRD and card description say. Today `sync_lookup.facility_id` is set to the
facility's own id for sensitive facilities, and the snapshot filter admits
`facility_id IS NULL OR facility_id IN (:facilityIds)` — so two sensitive facilities are islands,
isolated from each other as much as from everyone else. A shared network would pool two previously
separate confidential datasets the moment V6 lands, and T6's removal guard would then make that
unpickable. Networks of one preserve current behaviour exactly.

Consequence for W6: with networks of one, no facility is missing sibling data at upgrade time, so
the join-a-network resync has nothing to do on existing deployments. It stops being load-bearing
for the upgrade and only fires when an operator deliberately adds a facility to a network.

**Behaviour may change within this card.** The four cards ship as one release, so U6 does not need
to hold sync behaviour constant while it drops `is_sensitive`.

**Deleting a network with members is refused**, and this is implemented here rather than left to
T6. Otherwise it is a back door around T6's guard: the member facility either keeps a dangling
reference or turns ordinary and starts syncing confidential data everywhere. Implementation forced
the issue — the generic `beforeDestroy` hook in `utils/beforeDestroyHooks.ts` cascades a soft delete
to every `HasMany`/`HasOne` target, so a network declaring facilities as its children would delete
its members outright. `SensitiveNetwork` therefore declares no `initRelations` at all; `Facility`
carries the `belongsTo`, which is also what `sortInDependencyOrder` reads for sync ordering.

**A deleted facility still counts as a member** for that guard. It keeps its network reference, so
allowing the delete would leave a restored facility pointing at a network that no longer exists.
Not something the spec settled before implementation; added as a criterion.

**T6's move guard is relaxed for sole members.** As originally written, T6 forbade moving a facility
into a different network, which would have left a networks-of-one backfill unable to reach Fiji's
HIV network through the importer at all: forming it out of A, B and C means moving B and C out of
their own networks. The rule is now that a facility which is the sole member of its network may
move. That permits the merge and still forbids a facility leaving a network whose siblings' data it
already holds. T6's criteria need updating to match.

## Migrations

DDL and DML in separate files (`packages/database/CLAUDE.md`), in this order:

- [x] DDL: create `sensitive_networks`; add `facilities.sensitive_network_id` (nullable FK); add
      `sync_lookup.sensitive_network_id` (STRING, nullable, indexed) —
      `1787600000000-createSensitiveNetworks.ts`
- [x] DML: for each `facilities.is_sensitive = TRUE` facility that is not soft-deleted, create a
      network taking that facility's code and name, and point the facility at it —
      `1787600000001-backfillSensitiveNetworks.ts`
- [x] DDL: drop `facilities.is_sensitive` — `1787600000002-dropFacilityIsSensitive.ts`

The drop has to be its own file and follow the backfill, which reads the column. Reversing runs
them backwards, so the drop's `down` re-adds an empty column and the backfill's `down` refills it
from network membership.

Also added: the `SensitiveNetwork` model, `Facility.belongsTo(SensitiveNetwork)`, and a
`SensitiveNetwork` entry in `fake-data` (unique on both code and name, so both need to be distinct).

## Call sites that read facility sensitivity

`is_sensitive` on surveys, lab test types and reference drugs is a different concept and stays put.
Only these read the facility one:

- [x] `packages/database/src/sync/buildEncounterLinkedLookupFilter.ts` —
      `ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE` now tests `facilities.sensitive_network_id IS NOT
      NULL` and still writes `facilities.id`, so scoping stays per-facility. V6 flips it to write
      the network instead
- [x] `packages/database/src/models/Notification.ts` — uses that constant directly rather than
      through the helper, so it is a second call site. Picks the change up unchanged, since the
      constant kept its name
- [x] `packages/database/__tests__/sync/syncLookupFacilityScope.test.ts` — `SENSITIVE_SCOPE_MARKER`
      moved to `'facilities.sensitive_network_id'`
- [x] `packages/database/src/models/User.ts` — `allowedFacilities`, both the count shortcut and the
      non-sensitive union
- [x] `packages/mobile/App/models/User.ts` — mobile's own copy of the same logic, which the card
      description does not mention

Two entries from the original list turned out not to exist. Neither
`packages/fake-data/src/fake/fake.ts` nor `packages/mobile/tests/helpers/fake.ts` carried a facility
`isSensitive`; every hit in both is `Survey` or `LabTestType`.
`firstTimeSetup/databaseDefinition.ts` likewise does not need touching: its `isSensitive` is on the
`survey` table, and fresh mobile installs pick the facility column up from the migration.

## Mobile

- [x] `SensitiveNetwork` entity plus `MODELS_MAP` registration, ahead of `Facility` so the network
      exists before a facility referencing it
- [x] TypeORM migration creating the table
- [x] TypeORM migration adding `facilities.sensitiveNetworkId` and dropping `isSensitive`. No local
      backfill: mobile pulls facilities fresh from central, which has already run its own

## dbt

- [x] `database/model/public/sensitive_networks.yml` and `.md` written, `facilities` swapped from
      `is_sensitive` to `sensitive_network_id`, and `sync_lookup` given the new column, all with
      descriptions filled in rather than left as TODOs
- [ ] **Not run:** `npm run dbt-generate-model` and `npm run dbt-check-todos`. No npm in this
      environment, so the yml above is hand-written to match the generator's shape and needs
      reconciling against the live schema. The `config.meta.triggers` list for `sensitive_networks`
      in particular is generated and was left out rather than guessed

## Existing tests reworked

- [x] `packages/central-server/__tests__/sync/CentralSyncManager.sensitiveFacilities.test.js` — a
      `createNetworkId` helper gives each sensitive facility its own network of one, and the suite
      truncates networks alongside facilities
- [x] `packages/facility-server/__tests__/apiv1/User.test.js` — the two sensitive facilities are
      now networks of one, plus a new case for a network sibling

Two of that suite's edge cases move a facility out of a network
(`sensitiveNetworkId: null`) or into one after the fact. Nothing stops that today, but T6's guard
will, so both need revisiting when it lands.

## New tests

- [x] `packages/database/__tests__/models/SensitiveNetwork.test.ts` — membership, code and name
      uniqueness, and the delete guard including the cascade trap and soft-deleted members
