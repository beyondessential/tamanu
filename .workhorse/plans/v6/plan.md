# Sync lookup: population + snapshot filtering for sensitive networks

## Population

`buildEncounterLinkedLookupFilter` sets `sensitiveNetworkId` from `facilities.sensitive_network_id`
and `facilityId` to NULL, replacing `ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE`. The column is already
NULL for non-sensitive facilities, so no `CASE` is needed and the constant can go. `Notification`
uses the constant directly and is the second call site. `updateLookupTable.js` learns the column in
its INSERT column list, its select, and its `ON CONFLICT DO UPDATE` list.

The guard test needs no change: U6 already moved `SENSITIVE_SCOPE_MARKER` to
`facilities.sensitive_network_id`, and that string stays in the select afterwards.

Two ways this fails open rather than erroring, both worth a test that would catch them:

- **The `ON CONFLICT DO UPDATE` list.** Add `sensitive_network_id` to the INSERT but miss it in the
  update list, and an existing row rebuilt incrementally gets `facility_id` nulled while keeping a
  stale (usually NULL) network. The row ends with neither scope and syncs everywhere.
- **Positional coupling.** `buildLookupUpsertQuery`'s INSERT column list and `buildSyncLookupSelect`'s
  SELECT are matched by position across two files, and `facility_id`/`sensitive_network_id` are both
  string/UUID. Transposing them compiles, runs, and scopes every sensitive record to a facility id
  that is really a network id.

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

**Derive this list server-side; never accept it from the request body.** `facilityIds` is
client-supplied and validated at session start against the sync user's facility access
(`buildSyncRoutes.js:56-59`). Deriving the networks from that validated list is what keeps network
scoping inside the same guard. It also makes W6's narrowing parameter safe to accept from a client,
since it can then only narrow within networks the requester genuinely belongs to. If the network list
were ever taken from the body, that guard is gone and a client could name any network.

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

**Precedent, if the flagged-rebuild route is preferred instead.**
`1785372544730-RebuildLookupTableForSensitiveFacilityScopedModels.ts` does the conditioned rebuild:
bail unless a sensitive facility exists, then `flag_lookup_model_to_rebuild(:tableName)` per model,
letting the tick-preserving full-rebuild path re-materialise from source. It flagged 4 models and its
own comment notes vitals alone made the rebuild non-free; V6 would be flagging around 50, including
`encounters`, `notes` and `survey_responses`. That scale is the argument for the targeted update.

## Out of scope

`syncAllLabRequests` already bypasses sensitivity: the snapshot clause is
`(patientClause AND facilityClause) OR is_lab_request IS TRUE`, so a facility with the setting on
pulls lab requests from sensitive facilities today. Unchanged here, but it is a live confidentiality
hole rather than a neutral omission.

## Not covered here

The non-lookup snapshot path (`snapshotOutgoingChangesFromModels`, used when
`sync.lookupTable.enabled` is false) has no facility-sensitivity filtering at all, before or after
this card. Default config is `enabled: true`, so it is effectively legacy, but a deployment running
with it off has no sensitive scoping either way.
