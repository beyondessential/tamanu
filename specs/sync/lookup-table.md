---
id: LOOKUP
---

# Sync lookup table

The sync lookup table (`sync_lookup`) is a central-server-only denormalised snapshot of every record that can be pulled to facilities; outgoing sync snapshots are built from it rather than from the source tables directly. It is kept aligned with its source tables by an incremental build and by a self-healing mechanism that repairs rows whose source records changed without advancing the sync clock — for example, when a migration alters data.

## Populating the lookup table

- [ ] The lookup table exists only on the central server; facility servers have no lookup table.
- [ ] Each lookup row corresponds to one source record, keyed together by record id and record type, and holds a denormalised copy of the record's synced data plus the columns sync filtering needs (patient, encounter, facility, lab-request flag, deletion state, and sync tick).
- [ ] Only records from models that sync to facilities (pull-from-central or bidirectional) appear in the lookup table.
- [ ] A background process rebuilds the lookup table incrementally, selecting source records whose sync tick is greater than the tick the lookup table was last built up to, and upserting them by record id and record type.
- [ ] During an incremental build, rebuilt rows are staged and assigned their settled sync tick only after the build commits, so a concurrent sync session never reads a row at a premature tick.
- [ ] Outgoing sync snapshots read exclusively from the lookup table.
- [ ] A per-model full rebuild can be requested; when set, every row for that model is reselected from source and each row's sync tick is taken from its source record, so facilities do not re-pull records they already hold.

## Flagging records for rebuild

- [ ] The lookup table carries a boolean `needs_rebuild` flag on each row. The mechanism uses this flag rather than comparing sync ticks, so healing a row never requires advancing its sync tick.
- [ ] Flagging is performed by the sync tick trigger itself, not a separate trigger. A write that advances the sync clock stamps the source record's tick as normal and does not touch the lookup table — the incremental build catches such writes. When the trigger is in its disabled mode instead, it marks the corresponding lookup row as needing rebuild.
- [ ] The trigger flags for rebuild only for tables that feed the lookup table, and only on the central server. This is fixed when the trigger is installed: the install process, which has each model's sync direction and the server type in context, tells the trigger per table whether that table is lookup-tracked.
- [ ] When flagging a record that has no lookup row yet, the trigger creates a stub row marked as needing rebuild.
- [ ] A stub row has no data payload — its `data` is null — and carries placeholder values for its other columns, which are never read because the row is excluded from snapshots until it is healed.
- [ ] In the flag branch the trigger only sets the flag and, where needed, stubs a missing row; it never rebuilds a row's data inline. Clock-advancing writes add no lookup-table write at all, so normal traffic places no extra load on the lookup table.
- [ ] Migrations put the sync tick trigger into its disabled mode rather than removing it, so data changed by migrations — which does not advance the sync clock — is flagged for rebuild without churning sync ticks.
- [ ] Hard-deleted source records are removed from the lookup table by a delete trigger on lookup-tracked tables, which deletes the corresponding lookup row directly. It fires on every hard delete and remains active during migrations, so bulk deletions performed by a migration are cleaned up. Soft deletes are ordinary updates and need no special handling.
- [ ] A post-migration step keeps both triggers correct on every lookup-tracked table, including tables introduced by a later migration: the sync tick trigger configured as lookup-tracked, and the delete trigger present.
- [ ] Lookup rows with no data payload are excluded from outgoing sync snapshots, so a stub is never sent to a facility before it is built.

## Rebuilding flagged records

- [ ] The lookup build runs in two passes: the normal incremental build, followed by a self-heal pass over rows still marked as needing rebuild.
- [ ] Both passes clear the rebuild flag on any row they rebuild.
- [ ] After the incremental pass, the only rows left marked for rebuild are those whose source record changed without advancing the sync clock, which the incremental pass does not select.
- [ ] Rows marked for rebuild are located through a partial index covering only those rows, so the self-heal pass does not scan the whole lookup table.
- [ ] The self-heal pass rebuilds each flagged row's data from its source record and sets the row's sync tick to the source record's current sync tick, without routing through the incremental build's staged-tick handling.
- [ ] Taking the tick from the source record means a healed existing row keeps its sync tick — a drifted record's source tick has not moved, so facilities do not re-pull records they already hold — while a record that reached the table only as a stub propagates on the same terms its source record would.
- [ ] A source record that is soft-deleted is rebuilt normally, with its lookup row marked as deleted.
- [ ] If the self-heal pass finds a flagged row whose source record no longer exists, it deletes the lookup row — a backstop to the delete trigger for any row flagged before its source was removed.

## Blocking upgrades until the lookup table is consistent

- [ ] The central-server migration process runs the lookup table rebuild process — both passes — as its final step.
- [ ] Migrations run during server downtime, so no source records are written during this final build; the absence of rows marked for rebuild on completion is therefore a reliable signal of consistency.
- [ ] An upgrade does not complete until that build finishes with no rows left marked as needing rebuild, so a server never returns to service with a lookup table that has drifted from its source tables.
