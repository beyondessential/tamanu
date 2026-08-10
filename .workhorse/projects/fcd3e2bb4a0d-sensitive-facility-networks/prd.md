# Sensitive facility networks

## Overview

Tamanu supports sensitive facilities: encounter-linked and program form data recorded at a sensitive facility stays at that facility and never syncs elsewhere. Fiji's HIV programme needs that data shared across a group of hubs while still being withheld from the rest of the country.

This project replaces the per-facility `is_sensitive` flag with named **sensitive networks**. A facility belongs to at most one network, and sensitive data syncs to every facility in that network and nowhere else. A single sensitive facility becomes a network of one.

Worked example: facilities A, B and C form one HIV network; D and E are ordinary hospitals. Data recorded at A syncs to B and C only, data recorded at D syncs everywhere. Multiple networks are supported, so A/B/C alongside D/E is valid, but C cannot also sit in a second network with D.

Backend only. Networks are configured through the reference data spreadsheet, so there is no UI work.

---

## Priority summary

| # | Original request | Feature | Design work |
|---|------------------|---------|-------------|
| 1 | TAM-6886 | Sensitive network schema and migration of existing sensitive facilities | None |
| 2 | TAM-6887 | Reference data import and guard against membership removal | None |
| 3 | TAM-6888 | Sync lookup population and snapshot filtering | None |
| 4 | TAM-6889 | Resync historic sensitive data when a facility joins a network | None |

All four are Urgent, sequential, and sized for one developer (5, 3, 5, 5 points). Card 3 depends on card 1's schema; card 4 depends on card 3's filter.

---

## Requirements

### 1. Sensitive network schema and migration of existing sensitive facilities

Establish the data model. Nothing changes behaviourally until requirement 3 lands.

**New table `sensitive_networks`.**

- `id` (UUID PK), `name` (STRING, not null)
- Standard Tamanu fields: `created_at`, `updated_at`, `deleted_at`, `updated_at_sync_tick`
- Syncs as reference data (`PULL_FROM_CENTRAL`)

**Facility membership.**

- `sensitive_network_id` FK on `facilities`, nullable. At most one network per facility
- Drop `is_sensitive`. Whether the column is removed outright or derived as `sensitive_network_id IS NOT NULL` is an open question (see below)
- `Facility` model in `packages/database/src/models/Facility.ts` gains the association and drops `isSensitive`

**New column on `sync_lookup`.**

- `sensitive_network_id` (STRING, nullable, indexed)
- Takes over the role `facility_id` currently plays for sensitive-data filtering. `facility_id` continues to scope genuinely facility-bound records such as `patient_facilities` and facility-scoped settings

**Migrations, DDL/DML separated** (see `packages/database/CLAUDE.md`):

1. DDL: create `sensitive_networks`
2. DDL: add `sensitive_network_id` to `facilities` (FK) and to `sync_lookup` (with index)
3. DML: backfill, moving every existing `is_sensitive = TRUE` facility into a single network

The backfill leans on requirement 4: once the facilities land in a shared network, the join-a-network resync pulls each one the sibling data it is missing.

Regenerate the dbt source models under `database/model/` alongside the migrations.

**Mobile.** Corresponding TypeORM migrations for `sensitive_networks` and `facilities.sensitive_network_id`. Mobile pulls the reference data only; the `sync_lookup` logic is central-server only. Existing mobile migration `1752187477000-addFacilityIsSensitiveColumn.ts` is the precedent for the facility column.

---

### 2. Reference data import and guard against membership removal

**Importer.**

- New `sensitiveNetworks` sheet defining networks (id, name)
- New `networkId` column on the `facility` sheet assigning a facility to a network, replacing the old sensitivity column
- The new type needs an entry in `OTHER_REFERENCE_TYPES` (`packages/constants/src/importable.ts`), an import schema in `baseSchemas.js`, and either default provisioning data or an entry in `EXCLUDED_FROM_FULL_IMPORT_CHECK`, otherwise `provision` fails on the completeness check

**Guard against removal.** Enforced at write time, ideally as `Facility` model validation with the importer as fallback:

- A facility cannot be removed from a network once assigned
- A facility cannot be moved into a different network
- Adding a facility to an existing network is allowed, and triggers the resync in requirement 4

Removal is unsafe because sensitive data already synced to a facility cannot be un-synced. The only safe path is wiping the facility's local data and doing a full resync, so the constraint is enforced in code rather than left to operator discipline.

---

### 3. Sync lookup population and snapshot filtering

The behavioural change. Sensitive data becomes visible across a network.

**Population.** `packages/database/src/sync/buildEncounterLinkedLookupFilter.ts` currently sets `facilityId` via `ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE`, a `CASE` on `facilities.is_sensitive`. Replace it with a straight `sensitiveNetworkId: 'facilities.sensitive_network_id'` and `facilityId: NULL`. No `CASE` is needed, because the column is already NULL for non-sensitive facilities. Around 50 encounter-linked models route through this helper, so they all pick the change up.

`packages/central-server/app/sync/updateLookupTable.js` needs `sensitive_network_id` added to the INSERT and `ON CONFLICT DO UPDATE` column lists, alongside `facility_id` and `patient_id`.

**Snapshot filter.** `packages/central-server/app/sync/snapshotOutgoingChanges.js` (currently around lines 271-277) filters `facility_id IS NULL OR facility_id IN (:facilityIds)`. It becomes:

```
AND (
  (facility_id IS NULL AND sensitive_network_id IS NULL)
  OR facility_id IN (:facilityIds)
  OR sensitive_network_id IN (:sensitiveNetworkIds)
)
```

`:sensitiveNetworkIds` is resolved from the requesting facility's network membership. A facility with no network gets an empty list, and the clause reduces to today's behaviour.

**Guard test.** `packages/database/__tests__/sync/syncLookupFacilityScope.test.ts` asserts every encounter-linked model carries the sensitive scope marker. Its `SENSITIVE_SCOPE_MARKER` moves from `facilities.is_sensitive` to `facilities.sensitive_network_id`.

**Out of scope.** The existing "sync all lab requests" behaviour is unchanged. No network special-casing there.

---

### 4. Resync historic sensitive data when a facility joins a network

A facility added to an existing network must pull all historic sensitive data from its siblings, not only data created after it joined. Without this, the backfill in requirement 1 leaves each facility with a partial view.

This mirrors the existing `patient_facilities` mechanism in `packages/central-server/app/sync/CentralSyncManager.js` (around lines 486-580), which runs a two-phase snapshot: full history for newly-marked patients, incremental for everything else.

1. **Detect.** During pull setup, work out whether the requesting facility's `sensitive_network_id` has changed or was recently set. Either track it via a `LocalSystemFact` or compare the facility's current network against a stored last-known network for the device
2. **Full resync.** On a detected change, run an additional snapshot pass with `since = -1` scoped to `sensitive_network_id = :newNetworkId` across all encounter-linked models
3. **Additions only.** Removal is blocked by requirement 2, so only additions reach this path

---

## Open questions

- For change detection in requirement 4, `LocalSystemFact` versus a stored last-known network per device. Both are viable; pick during card shaping.