# Sensitive facility networks

Four sequential backend cards, one per PRD requirement. Cards 1 and 2 are inert groundwork, card 3 flips the behaviour, and card 4 makes joining a network retroactive. Card 3 depends on card 1's schema, card 4 on card 3's filter.

## Add sensitive network schema and migrate existing sensitive facilities

Introduce the `sensitive_networks` reference-data table, a nullable FK `sensitive_network_id` on `facilities`, and a nullable indexed `sensitive_network_id` on `sync_lookup`. Sequelize migrations keep DDL and DML in separate files, with the DML backfill moving every existing sensitive facility into one shared network, and the dbt source models under `database/model/` regenerated alongside. Mobile gets matching TypeORM migrations for the new table and the facility column. `is_sensitive` is dropped rather than kept as a derived column, so the readers of it outside sync move to testing network membership, notably the facility access list in `User.allowedFacilities`. Nothing changes behaviourally: this card lands only the data model the later cards build on.

## Import sensitive networks and block membership changes

Add a `sensitiveNetworks` sheet to the reference data importer and a network column on the `facility` sheet, retiring the old sensitivity column. The new type needs its entry in `OTHER_REFERENCE_TYPES`, an import schema, and either default provisioning data or an exclusion from the full-import completeness check, otherwise provisioning fails. Alongside the importer, enforce at write time that a facility can be added to a network but never removed from one or moved to another, since sensitive data already synced to a facility cannot be recalled.

## Scope sensitive sync by network instead of facility

The behavioural change. `buildEncounterLinkedLookupFilter` populates `sensitive_network_id` from the facility rather than conditionally populating `facility_id`, which carries the change to every encounter-linked model routed through it plus the direct call site in `Notification`. The lookup table upsert learns the new column, and the outgoing snapshot filter admits rows whose network matches the requesting facility's, leaving a facility with no network on today's behaviour. Existing lookup rows carry the old facility-based scoping, so this card also rebuilds the affected `sync_lookup` rows. The guard test's sensitive scope marker moves to the new column, and the existing sensitive facility sync tests are reworked around networks. Sync-all-lab-requests behaviour is untouched.

## Resync historic sensitive data when a facility joins a network

A facility newly added to a network pulls its siblings' entire sensitive history, not just what was recorded after it joined, which is what makes the card 1 backfill produce a complete view at every member facility. Detect the membership change during pull setup and run an additional full-history snapshot pass scoped to the new network across encounter-linked models, following the two-phase pattern `CentralSyncManager` already uses for newly-marked patients in `patient_facilities`. Only additions reach this path, since card 2 blocks removals and moves.
