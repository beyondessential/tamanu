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

**Deleting a network with members is refused.** Otherwise it is a back door around T6's guard: the
member facility either keeps a dangling reference or turns ordinary and starts syncing confidential
data everywhere. The rule is specified here because it constrains the data model, but it sits
naturally with T6's other write-time guards, so implement it there unless T6 has already shipped.

## Open: networks of one collide with T6's move guard

T6 forbids moving a facility into a different network. After a networks-of-one backfill, forming
Fiji's HIV network out of existing sensitive facilities A, B and C means moving B and C out of
their own networks — which that guard blocks. The backfill would leave the target state
unreachable through the importer.

Narrowest fix: allow a move when the facility is the **sole member** of its current network. That
permits the merge, and still forbids the genuinely unsafe case of a facility leaving a network
whose siblings' data it already holds. Needs confirming, and it changes T6's criteria.

## Migrations

DDL and DML in separate files (`packages/database/CLAUDE.md`), in this order:

- [ ] DDL: create `sensitive_networks`; add `facilities.sensitive_network_id` (nullable FK); add
      `sync_lookup.sensitive_network_id` (STRING, nullable, indexed)
- [ ] DML: for each `facilities.is_sensitive = TRUE` facility that is not soft-deleted, create a
      network taking that facility's code and name, and point the facility at it
- [ ] DDL: drop `facilities.is_sensitive`

The drop has to be its own file and follow the backfill, which reads the column.

## Call sites that read facility sensitivity

`is_sensitive` on surveys, lab test types and reference drugs is a different concept and stays put.
Only these read the facility one:

- [ ] `packages/database/src/sync/buildEncounterLinkedLookupFilter.ts` —
      `ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE` is a `CASE` on `facilities.is_sensitive`. V6 owns
      the semantics; U6 only has to keep it compiling
- [ ] `packages/database/src/models/Notification.ts` — uses that constant directly rather than
      through the helper, so it is a second call site
- [ ] `packages/database/__tests__/sync/syncLookupFacilityScope.test.ts` — `SENSITIVE_SCOPE_MARKER`
      is the literal `'facilities.is_sensitive'` and must match whatever the select ends up with
- [ ] `packages/database/src/models/User.ts:329,343` — `allowedFacilities`, both the count shortcut
      and the non-sensitive union
- [ ] `packages/mobile/App/models/User.ts:82,98` — mobile's own copy of the same logic, which the
      card description does not mention
- [ ] `packages/fake-data/src/fake/fake.ts` — facility `isSensitive`

`firstTimeSetup/databaseDefinition.ts` does **not** need touching: its `isSensitive` is on the
`survey` table, and fresh mobile installs pick up the facility column from the migration.

## Mobile

- [ ] `SensitiveNetwork` entity plus `MODELS_MAP` registration, so the reference data pulls down
- [ ] TypeORM migration creating the table
- [ ] TypeORM migration adding `facilities.sensitiveNetworkId` and dropping `isSensitive`
      (`1752187477000-addFacilityIsSensitiveColumn.ts` is the precedent)
- [ ] `packages/mobile/tests/helpers/fake.ts`

## dbt

- [ ] `npm run dbt-generate-model`, then fill the new TODOs: descriptions for
      `sensitive_networks`, its table tag, and the new columns on `facilities` and `sync_lookup`
- [ ] `npm run dbt-check-todos` before pushing — CI fails on leftovers

## Existing tests to rework

- [ ] `packages/central-server/__tests__/sync/CentralSyncManager.sensitiveFacilities.test.js`
- [ ] `packages/facility-server/__tests__/apiv1/User.test.js`
