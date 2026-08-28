# Sync lookup: population + snapshot filtering for sensitive networks

## Population

`buildEncounterLinkedLookupFilter` sets `sensitiveNetworkId` from `facilities.sensitive_network_id`
and `facilityId` to NULL, replacing `ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE`. The column is already
NULL for non-sensitive facilities, so no `CASE` is needed and the constant can go. `Notification`
uses the constant directly and is the second call site. `updateLookupTable.js` learns the column in
its INSERT column list, its select, and its `ON CONFLICT DO UPDATE` list.

The guard test needs no change: U6 already moved `SENSITIVE_SCOPE_MARKER` to
`facilities.sensitive_network_id`, and that string stays in the select afterwards.

## Snapshot filter

```sql
AND (
  <patientClause>
  AND (
    (facility_id IS NULL AND sensitive_network_id IS NULL)
    OR facility_id IN (:facilityIds)
    OR sensitive_network_id IN (:sensitiveNetworkIds)
  )
  <OR is_lab_request IS TRUE, when syncAllLabRequests>
)
```

The first line is load-bearing. `facility_id IS NULL` alone used to mean "unscoped", but a
network-scoped row also has a null `facility_id`, so leaving that condition as it stands admits every
sensitive record to every facility. Both columns must be null for a row to count as unscoped. This is
the one place the change fails open, so it wants a test that would catch it.

Network list resolved from the session's facilities:

```sql
SELECT DISTINCT sensitive_network_id
FROM facilities
WHERE id IN (:facilityIds)
  AND sensitive_network_id IS NOT NULL
```

A facility in no network contributes no network, so a session with no networked facility resolves an
empty list. Omit the clause entirely in that case rather than passing an empty array, following the
pattern the file already uses for `syncAllLabRequests`.

Keep the resolved network list a **parameter** of the filter rather than deriving it inline. V6 only
ever populates it from the requesting facilities' membership, but W6 needs an explicit network id for
its `since = -1` catch-up pass. A parameter lets W6 extend this rather than fork it.

Note W6's catch-up needs its own `AND`-composed where clause, not this admission clause with
different parameters. The clause above is `OR`-composed, so `sensitive_network_id IN (...)` admits
the whole network regardless of `facilityIds`, and the unscoped line pulls the entire non-sensitive
dataset at `since = -1`. `facilityIds` also can't be repurposed to carry sibling ids: it scopes
`patient_facilities` and facility settings in the same query, and model-specific filters outside this
file consume it (`Referral.buildSyncFilter`).

**Open decision — whether to null `facility_id` on rescoped rows.** The card says null it, which
makes `facility_id` mean exactly one thing (genuinely facility-bound). Keeping it populated alongside
the network filters identically — a row with `facility_id = F` and `network = N2` is admitted to F by
the facility clause and to F's siblings by the network clause — but it lets W6's catch-up narrow with
`AND facility_id IN (:newlyVisibleFacilityIds)` so a facility pulls only the data of members newly
visible to it, never its own. Nulled, W6 can only re-pull the network's whole history per member.

## Rescoping existing lookup rows

Least-data approach, rather than the per-model full rebuild:

- Touch only rows whose `facility_id` points at a facility that belongs to a network, and whose
  record type is encounter-scoped. Those are exactly the rows the old sensitivity `CASE` wrote.
- Set the network from the facility, null the facility.

```sql
UPDATE sync_lookup
SET sensitive_network_id = facilities.sensitive_network_id,
    facility_id = NULL
FROM facilities
WHERE sync_lookup.facility_id = facilities.id
  AND facilities.sensitive_network_id IS NOT NULL
  AND sync_lookup.record_type IN (:encounterScopedRecordTypes);
```
- **Leave `updated_at_sync_tick` alone.** Nothing stamps `sync_lookup` itself — the sync tick and
  hard-delete triggers sit on the source tables and write into it — so a direct update preserves
  ticks and no facility re-pulls.
- **Skip rows whose facility was deleted while sensitive.** U6's backfill gives those facilities no
  network, so nulling their facility would leave the row with neither scope and sync it everywhere.
- A deployment with no networked facility touches zero rows.

Derive the encounter-scoped record types from the model registry rather than listing them, using the
same predicate the guard test uses (table is `encounters`, or its lookup joins reach `encounters`).
That set also catches `Notification`, whose joins reach encounters.

## Out of scope

`syncAllLabRequests` already bypasses sensitivity: the snapshot clause is
`(patientClause AND facilityClause) OR is_lab_request IS TRUE`, so a facility with the setting on
pulls lab requests from sensitive facilities today. Unchanged here, but it is a live confidentiality
hole rather than a neutral omission.
