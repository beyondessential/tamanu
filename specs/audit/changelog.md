---
id: AUDIT
---

# Changelog

The changelog (`logs.changes`) is a row-level history of writes to the tables Tamanu logs. A **changelog entry** is one row of that history: it records a single change to a single row of a logged table, holding the whole row as JSON along with who made the change, from which device, and on which version. A database trigger on each logged table writes the entries. The database writes them itself, so a change reaches the changelog whichever path produced it: an API request, a background task, a migration, or hand-run SQL.

An entry for a change made by a migration is a **migration entry**, and carries the context of the migration that made it. An entry for a change made by any other path is an **operational entry**. The user an entry is credited to is its **audit user**. An entry imported from an earlier history store is an operational entry carrying the original change's provenance, because it describes the operational change, not the import.

Changelog entries do not synchronise as records of their own. Each entry is **attached** to the record it describes and travels with it, so a record's history follows the record between a facility server and central, and each entry is authored exactly once, on the server where the change happened.

## What is logged

- [ ] Tables in the `public` schema carry a changelog trigger, except the excluded set below. Tables in the `logs` schema carry no changelog triggers, so changelog entries produce no entries about themselves.
- [ ] The excluded tables are internal authentication tables, internal sync tables, caches, ephemeral AI form-builder chat state, retained historical signer records, server-local configuration and secrets, and the migration bookkeeping table.
- [ ] Every logged table carries a single `id` column, which is what an entry records as the target's ID. No logged table is identified by a composite key.
- [ ] Each logged table carries exactly one changelog trigger, so one change to one row produces one entry.
- [ ] Installing the trigger is part of every upgrade, so a table introduced by a migration is logged from the upgrade that adds it.

## What an entry contains

- [ ] An entry identifies its target by table (schema, name, and the table's object identifier) and by record ID.
- [ ] An entry holds the record's whole row as JSON, as it stands after the change.
- [ ] Serialising a row to JSON is deterministic: the same row state always produces the same JSON, so entries for the same row state compare equal.
- [ ] An entry carries the record's own created, updated and soft-deleted timestamps, and the time the entry itself was logged, taken from the server clock with its timesync offset applied.
- [ ] A soft delete is an update, so its entry carries the record's deletion timestamp, and the record's updated timestamp moves with it.
- [ ] An entry carries the provenance of the change:
  - [ ] the audit user,
  - [ ] the device,
  - [ ] the Tamanu version,
  - [ ] an optional reason, and
  - [ ] for a migration entry, the migration context (direction, migration name, and server type).
- [ ] Each entry is stamped with the sync tick current when it was written, which is how outgoing sync batches select the entries to attach.
- [ ] Entries serve product behaviour as well as audit: a migration entry stays distinguishable from an operational one. For example, invoicing's encounter ward-move history (see `specs/invoicing/encounter-fees.md`), a patient's program registration history, and vitals edit history (see `specs/vitals/overview.md`) are all reconstructed from entries, with migration entries excluded.

## When entries are written

- [ ] The changelog trigger fires on insert and update.
- [ ] Entries materialise at commit, because the trigger is a deferred constraint trigger. A transaction that rolls back leaves no entries behind.
- [ ] A query made inside the writing transaction does not yet see the entries for its own writes.
- [ ] A transaction that has written to a logged table has changelog trigger events pending against it, so it cannot go on to alter that table's schema. Migrations keep schema changes and data changes in separate migrations, each with its own transaction, so the pending events are processed in between.

## Attribution and pausing

- [ ] The audit user, the reason, and the migration context come from configuration on the database session, read by the trigger as it writes the entry.
- [ ] A change made with no audit user set is credited to the nil UUID, so an unattributed write still produces an entry.
- [ ] Every change to a logged table is recorded. The only thing that suppresses an entry is an explicit audit pause on the transaction making the change.
- [ ] An audit pause is scoped to the transaction that asks for it, so it has no effect on concurrent work.

## Synchronisation between servers

- [ ] An entry is attached to the record it describes, and moves between servers only as part of that record.
- [ ] A syncing record carries its attached entries with it. An outgoing snapshot row carries the entries matching its table and record ID, so a record and its history reach the peer in the same batch.
- [ ] The entries attached to an outgoing batch are bounded by the session's sync tick range: a facility push attaches entries from the tick of its last successful push, and a central pull attaches entries within the session's minimum and maximum source ticks. A batch whose tick range is unavailable goes without attached entries.
  - [ ] A record therefore arrives carrying the entries logged since the peer last synced it, not its whole history.
- [ ] The receiving server (central for a push, facility for a pull) separates the entries from the incoming records and inserts only those whose IDs it does not already hold, so re-delivering a batch adds nothing.
- [ ] The receiving server pauses auditing in the transaction that applies the incoming changes, not server-wide, so an entry is copied verbatim to its peer and the peer's own triggers author nothing for it. Everything else happening on that server at the time is still audited.
- [ ] Mobile devices keep no changelog. Central leaves auditing on while it applies a push from mobile, and its own triggers author the entries for mobile-originated changes. Pulls destined for mobile carry no attached entries.
