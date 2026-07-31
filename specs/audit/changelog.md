---
id: AUDIT
---

# Changelog

The changelog (`logs.changes`) is a row-level history of writes to the tables Tamanu logs. A database trigger on each logged table records one entry per changed row, holding the whole row as JSON along with who made the change, from which device, and on which version. The database writes entries itself, so a change reaches the changelog whichever path produced it: an API request, a background task, a migration, or hand-run SQL.

Changelog entries do not synchronise as records of their own. Each entry travels attached to the record it describes, so a record's history follows the record between a facility server and central, and each entry is authored exactly once, on the server where the change happened.

## What is logged

- [ ] Tables in the `public` schema carry a changelog trigger, except the excluded set below. Tables in the `logs` schema carry no changelog triggers, so changelog entries produce no entries about themselves.
- [ ] The excluded tables are internal authentication tables, internal sync tables, caches, ephemeral AI form-builder chat state, retained historical signer records, server-local configuration and secrets, and the migration bookkeeping table.
- [ ] Each logged table carries exactly one changelog trigger, so one change to one row produces one entry.
- [ ] Installing the trigger is part of every upgrade, so a table introduced by a migration is logged from the upgrade that adds it.

## What an entry contains

- [ ] An entry identifies its target by table (schema, name, and the table's object identifier) and by record id.
- [ ] An entry holds the record's whole row as JSON: the new row for an insert or an update, and the row as it stood immediately before removal for a hard delete.
- [ ] An entry carries the record's own created, updated and soft-deleted timestamps, and the time the entry itself was logged, taken from the server clock with its timesync offset applied.
- [ ] An entry is marked as a hard delete when the row was removed from its table. A soft delete is an update, so its entry carries the record's deletion timestamp and is not marked as a hard delete.
- [ ] An entry carries the provenance of the change: the user credited with it, the device, the Tamanu version, an optional reason, and, for a change made by a migration, the migration context (direction, migration name, and server type).
- [ ] Each entry is stamped with the sync tick current when it was written. That tick is what bounds the queries which attach entries to outgoing sync batches.
- [ ] Entries serve product behaviour as well as audit: invoicing reconstructs an encounter's ward-move history from its entries and excludes those made by a migration, so an entry's migration context stays distinguishable from a change made in the course of care (see `specs/invoicing/encounter-fees.md`).

## When entries are written

- [ ] The changelog trigger fires on insert, update and delete.
- [ ] Entries materialise at commit, because the trigger is a deferred constraint trigger. A transaction that rolls back leaves no entries behind, and a query made inside the writing transaction does not yet see the entries for its own writes.
- [ ] A transaction that has written to a logged table has changelog trigger events pending against it, so it cannot go on to alter that table's schema. Migrations keep schema changes and data changes in separate migrations, each with its own transaction, so the pending events are processed in between.

## Attribution and pausing

- [ ] The user credited with a change, the reason, and the migration context come from configuration on the database session, read by the trigger as it writes the entry.
- [ ] A change made with no user set is credited to the nil UUID, so an unattributed write still produces an entry.
- [ ] Every change to a logged table is recorded. The only thing that suppresses an entry is an explicit audit pause on the transaction making the change.
- [ ] An audit pause is scoped to the transaction that asks for it, so it has no effect on concurrent work.

## Synchronisation between servers

- [ ] Each entry travels attached to the record it describes. An outgoing snapshot row carries the entries matching its table and record id, so a record and its history move to the peer in the same batch.
- [ ] The entries attached to an outgoing batch are bounded by the session's sync tick range: a facility push attaches entries from the tick of its last successful push, and a central pull attaches entries within the session's minimum and maximum source ticks. A batch whose tick range is unavailable goes without attached entries.
- [ ] A receiving server separates the entries from the incoming records and inserts only those whose ids it does not already hold, so re-delivering a batch adds nothing.
- [ ] A receiving server pauses auditing while it applies incoming changes, so an entry is copied verbatim to its peer and the peer's own triggers author nothing for it.
- [ ] Mobile devices keep no changelog. Central leaves auditing on while it applies a push from mobile, and its own triggers author the entries for mobile-originated changes. Pulls destined for mobile carry no attached entries.
- [ ] A hard delete's entry stays on the server that performed the delete. The deleted record produces no snapshot row on either side (a facility push snapshots live source rows by sync tick, and a central pull snapshots from the sync lookup table, whose row is removed once the source record is gone, see `specs/sync/lookup-table.md`), so the entry has nothing to travel with.
