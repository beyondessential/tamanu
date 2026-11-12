---
id: LOOKUP
---

# Sync lookup table

Applies to the sync lookup table (`sync_lookup`), the central-server-only denormalised snapshot of every record that can be pulled to facilities, and to how it is built, flagged for rebuild, healed and read.

## Populating the lookup table

- The lookup table exists only on the central server; facility servers have no lookup table.
- Each lookup row corresponds to one source record, keyed together by record id and record type, and holds a denormalised copy of the record's synced data plus the columns sync filtering needs (patient, encounter, facility, lab-request flag, deletion state, and sync tick).
- Only records from models that sync to facilities (pull-from-central or bidirectional) appear in the lookup table.
- A background process rebuilds the lookup table incrementally, selecting source records whose sync tick is greater than the tick the lookup table was last built up to, and upserting them by record id and record type.
- During an incremental build, rebuilt rows are staged and assigned their settled sync tick only after the build commits, so a concurrent sync session never reads a row at a premature tick.
- Outgoing sync snapshots read exclusively from the lookup table.
- A per-model full rebuild can be requested; when set, every row for that model is reselected from source and each row's sync tick is taken from its source record, so facilities do not re-pull records they already hold.

## Flagging records for rebuild

- The lookup table carries a boolean `needs_rebuild` flag on each row. The mechanism uses this flag rather than comparing sync ticks, so healing a row never requires advancing its sync tick.
- Flagging is performed by a dedicated trigger that fires after each insert or update, not by the sync tick trigger. A write that advances the sync clock stamps the source record's tick as normal and does not touch the lookup table — the incremental build catches such writes. When the sync tick trigger is in its disabled mode instead, the flagging trigger marks the corresponding lookup row as needing rebuild. It runs after the write so that identifiers the database computes for the row, such as a generated `id` column, are available.
- The flagging trigger is installed only on tables that feed the lookup table, and only on the central server. The install process, which has each model's sync direction and the server type in context, decides per table whether to install it.
- When flagging a record that has no lookup row yet, the flagging trigger creates a stub row marked as needing rebuild.
- A stub row has no data payload — its `data` is null — and carries placeholder values for its other columns, which are never read because the row is excluded from snapshots until it is healed.
- The flagging trigger only sets the flag and, where needed, stubs a missing row; it never rebuilds a row's data inline. Clock-advancing writes add no lookup-table write at all, so normal traffic places no extra load on the lookup table.
- Migrations put the sync tick trigger into its disabled mode rather than removing it, so data changed by migrations — which does not advance the sync clock — is flagged for rebuild without churning sync ticks.
- Hard-deleted source records are handled by a delete trigger on lookup-tracked tables, which marks the corresponding lookup row as needing rebuild. It fires on every hard delete and remains active during migrations, so bulk deletions performed by a migration are flagged too. A hard-deleted record's removal from the lookup table and any other record's rebuild that depends on it (for example, a foreign key repointed away from the deleted record) are applied together by the same build, so an outgoing snapshot never observes one change without the other. Soft deletes are ordinary updates and need no special handling.
- A post-migration step keeps both triggers correct on every lookup-tracked table, including tables introduced by a later migration: the flagging trigger and the delete trigger present.
- A hard delete concurrent with an in-progress build is detected: the build locks the source rows it reads, and aborts if one of them was hard-deleted by a separately-committed transaction after the build's read snapshot was taken. The next scheduled build retries with a fresh snapshot.
- Lookup rows with no data payload are excluded from outgoing sync snapshots, so a stub is never sent to a facility before it is built.

## Rebuilding flagged records

- The lookup build runs in two passes: the normal incremental build, followed by a self-heal pass over rows still marked as needing rebuild.
- Both passes clear the rebuild flag on any row they rebuild.
- After the incremental pass, the only rows left marked for rebuild are those whose source record changed without advancing the sync clock, which the incremental pass does not select.
- Rows marked for rebuild are located through a partial index covering only those rows, so the self-heal pass does not scan the whole lookup table.
- The self-heal pass rebuilds each flagged row's data from its source record but leaves the row's sync tick, without routing through the incremental build's staged-tick handling — a healed record's source tick has not moved, so facilities do not re-pull records they already hold.
- A source record that is soft-deleted is rebuilt normally, with its lookup row marked as deleted.
- If the self-heal pass finds a flagged row whose source record no longer exists, it deletes the lookup row. This is where a hard-deleted record's lookup row is removed, and it also covers any row flagged for another reason (for example, a migration) whose source was separately removed.

## Refreshing on demand

- Central's api can run a lookup table build (both passes) on demand, for central's own supervisor only, and answers once the build has committed and its rows have settled ticks.
- The answer carries the [highest real-change sync tick](changes-pending-check.md#highest-real-change-tick) as it stands after the build.
- An on-demand build and a scheduled build never run at the same time. One that is asked for while another runs waits for it, then runs.
- An on-demand build that aborts, such as on a concurrent hard delete, answers with an error.

## Blocking upgrades until the lookup table is consistent

- The central-server migration process runs the lookup table rebuild process — both passes — as its final step.
- Migrations run during server downtime, so no source records are written during this final build; the absence of rows marked for rebuild on completion is therefore a reliable signal of consistency.
- An upgrade does not complete until that build finishes with no rows left marked as needing rebuild, so a server never returns to service with a lookup table that has drifted from its source tables.
