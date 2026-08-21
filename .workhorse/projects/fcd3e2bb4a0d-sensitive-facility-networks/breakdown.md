# Sensitive facility networks

Four sequential backend cards, one per original Linear ticket (TAM-6886 to TAM-6889). Cards 1 and 2 are inert groundwork, card 3 flips the behaviour, and card 4 makes joining a network retroactive. Card 3 depends on card 1's schema, card 4 on card 3's filter. All four are Urgent, sized 5, 3, 5 and 5 points for one developer.

## Sensitive network schema + migrate existing sensitive facilities · U6

Establish the data model for sensitive networks, replacing the per-facility `is_sensitive` flag with network membership. Nothing changes behaviourally until card 3 lands.

**New table `sensitive_networks`.** `id` (UUID PK) and `name` (STRING, not null), plus the standard Tamanu fields (`created_at`, `updated_at`, `deleted_at`, `updated_at_sync_tick`), syncing as reference data (`PULL_FROM_CENTRAL`).

**Facility membership.** A nullable `sensitive_network_id` FK on `facilities`, at most one network per facility. `is_sensitive` is dropped outright rather than retained as a derived column, so sensitivity is `sensitive_network_id IS NOT NULL` wherever it is needed, and the `Facility` model gains the association and loses `isSensitive`.

**Non-sync readers of facility sensitivity.** `User.allowedFacilities` counts sensitive facilities to shortcut to full access and lists non-sensitive ones to union with a user's explicit links. Both queries move to testing `sensitiveNetworkId` for null. Facility access stays per-facility, so a user linked to one member of a network gains no access to its siblings.

**New column on `sync_lookup`.** `sensitive_network_id` (STRING, nullable, indexed), taking over the role `facility_id` plays for sensitive-data filtering. `facility_id` continues to scope genuinely facility-bound records such as `patient_facilities` and facility-scoped settings.

**Migrations, DDL/DML separated.** Create the table, add the two columns, then a DML backfill moving every existing sensitive facility into one shared network, which card 4 then completes by pulling each facility the sibling data it is missing. Regenerate the dbt source models under `database/model/` alongside.

**Mobile.** Matching TypeORM migrations for `sensitive_networks` and the facility column. Mobile pulls the reference data only; the `sync_lookup` logic is central-server only.

## Reference data importer for sensitive networks + guard against removal

Allow networks and facility membership to be managed through the reference data spreadsheet, and prevent unsafe membership removals.

**Importer.** A new `sensitiveNetworks` sheet defining networks (id, name), and a `networkId` column on the `facility` sheet assigning a facility to a network, replacing the old sensitivity column. The new type needs an entry in `OTHER_REFERENCE_TYPES`, an import schema in `baseSchemas.js`, and either default provisioning data or an entry in `EXCLUDED_FROM_FULL_IMPORT_CHECK`, otherwise `provision` fails on the completeness check.

**Guard against removal.** Enforced at write time, ideally as `Facility` model validation with the importer as fallback: a facility cannot be removed from a network once assigned, and cannot be moved into a different one. Adding a facility to an existing network is allowed and triggers the card 4 resync. Removal is unsafe because sensitive data already synced to a facility cannot be recalled, so the only safe path is wiping the facility's local data and doing a full resync.

## Sync lookup: population + snapshot filtering for sensitive networks

Wire `sensitive_network_id` through lookup population and the outgoing snapshot filter so sensitive data syncs to every facility in the same network. This is the behavioural change.

**Population.** `buildEncounterLinkedLookupFilter` sets `sensitiveNetworkId` from `facilities.sensitive_network_id` and `facilityId` to NULL, replacing the `CASE` on `is_sensitive`. No `CASE` is needed because the column is already NULL for non-sensitive facilities. Around 50 encounter-linked models route through the helper and pick the change up; `Notification` uses the marker directly and needs updating as a second call site. `updateLookupTable.js` learns the new column in its INSERT and `ON CONFLICT DO UPDATE` lists.

**Snapshot filter.** `snapshotOutgoingChanges.js` admits a row when `facility_id` and `sensitive_network_id` are both null, when `facility_id` matches the requesting facility, or when `sensitive_network_id` matches its network. The network list is resolved from the requesting facility's membership, so a facility with no network gets an empty list and the clause reduces to today's behaviour.

**Lookup rebuild.** Existing `sync_lookup` rows still carry the old facility-based scoping, so the affected rows are rebuilt here rather than in card 1, since the rebuild must run against the new population logic.

**Tests.** The guard test's `SENSITIVE_SCOPE_MARKER` moves from `facilities.is_sensitive` to `facilities.sensitive_network_id`, and the existing sensitive facility sync tests are reworked around networks.

**Out of scope.** The existing sync-all-lab-requests behaviour is unchanged. No network special-casing there.

## Resync historic sensitive data when a facility joins a network

A facility added to an existing network must pull all historic sensitive data from its siblings, not only data created after it joined. Without this, the card 1 backfill leaves each facility with a partial view. It mirrors the `patient_facilities` mechanism in `CentralSyncManager.js`, which runs a two-phase snapshot: full history for newly-marked patients, incremental for everything else.

**Detect.** During pull setup, work out whether the requesting facility's `sensitive_network_id` has changed or was recently set, either by tracking it in a `LocalSystemFact` or by comparing the facility's current network against a stored last-known network for the device.

**Full resync.** On a detected change, run an additional snapshot pass with `since = -1` scoped to the new network across all encounter-linked models.

**Additions only.** Removal and reassignment are blocked by card 2, so only additions reach this path.