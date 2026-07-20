---
id: LOOKUP
---

# Sync lookup table

The sync lookup table (`sync_lookup`) is a central-server-only denormalised snapshot of every record that can be pulled to facilities. Outgoing sync snapshots are built from it rather than from the source tables directly. It is kept aligned with its source tables by an incremental build and by a self-healing mechanism that repairs rows whose source records changed without advancing the sync clock — the situation that arises when migrations alter data, since migrations deliberately do not advance the sync clock.

## Populating the lookup table

- [ ] The lookup table exists only on the central server; facility servers have no lookup table.
- [ ] Each lookup row corresponds to one source record, keyed together by record id and record type, and holds a denormalised copy of the record's synced data plus the columns sync filtering needs (patient, encounter, facility, lab-request flag, deletion state, and sync tick).
- [ ] Only records from models that sync to facilities (pull-from-central or bidirectional) appear in the lookup table.
- [ ] A background process rebuilds the lookup table incrementally, selecting source records whose sync tick is greater than the tick the lookup table was last built up to, and upserting them by record id and record type.
- [ ] During an incremental build, rebuilt rows are staged and assigned their settled sync tick only after the build commits, so a concurrent sync session never reads a row at a premature tick.
- [ ] Outgoing sync snapshots read exclusively from the lookup table.
- [ ] A per-model full rebuild can be requested; when set, every row for that model is reselected from source and each row's sync tick is taken from its source record, so facilities do not re-pull records they already hold.

## Flagging records for rebuild

- [ ] The lookup table carries a boolean `needs_rebuild` flag on each row, indicating the row must be rebuilt from source. The mechanism uses this flag rather than comparing sync ticks, so that healing a row never requires advancing its sync tick.
- [ ] Every table that feeds the lookup table (pull-from-central or bidirectional models) on the central server carries a trigger that fires on insert or update of a source record.
- [ ] The trigger marks the corresponding lookup row as needing rebuild. If no lookup row exists for the record yet, it creates a stub row marked as needing rebuild.
- [ ] A stub row has no data payload — its `data` is null — and carries sensible defaults for its other columns.
- [ ] The trigger only sets the rebuild flag and, where needed, stubs a missing row; it never rebuilds a row's data inline.
- [ ] The trigger fires on every write, including writes made while the sync tick trigger is disabled (for example, bulk imports), so that changes which do not advance the sync clock are still captured.
- [ ] The trigger is installed only on the central server, and only on tables that feed the lookup table.
- [ ] The rebuild trigger is not removed during migrations; it remains in place so that data changed by migrations, which does not advance the sync clock, is captured.
- [ ] Lookup rows with no data payload are excluded from outgoing sync snapshots, so a stub is never sent to a facility before it has been built.

## Rebuilding flagged records

- [ ] The lookup build runs in two passes: the normal incremental build, followed by a self-heal pass over rows still marked as needing rebuild.
- [ ] Both passes clear the rebuild flag on any row they rebuild.
- [ ] After the incremental pass, the only rows left marked for rebuild are those whose source record changed without advancing the sync clock, which the incremental pass does not select.
- [ ] Rows marked for rebuild are located through a partial index covering only those rows, so the self-heal pass does not scan the whole lookup table.
- [ ] The self-heal pass rebuilds each flagged row's data from its source record and sets the row's sync tick to the source record's current sync tick, without routing through the incremental build's staged-tick handling.
- [ ] Healing an existing row leaves its sync tick unchanged in practice, because a drifted source record's sync tick has not moved, so facilities do not re-pull records they already hold.
- [ ] A newly created record that reaches the lookup table only as a stub takes its sync tick from its source record when healed, so it propagates to facilities on the same terms as the source record would.
- [ ] A source record that is soft-deleted is rebuilt normally, with its lookup row marked as deleted.
- [ ] If a flagged row's source record no longer exists at all, the lookup row is deleted from the lookup table.

## Blocking upgrades until the lookup table is consistent

- [ ] The central-server migration process runs a full lookup build — both passes — as its final step.
- [ ] An upgrade does not complete until that build finishes with no rows left marked as needing rebuild, so a server never returns to service with a lookup table that has drifted from its source tables.
