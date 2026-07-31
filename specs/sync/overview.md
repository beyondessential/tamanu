---
id: SYNC
---

# Sync

Multi-directional data synchronisation between central, facility, and mobile servers.

Facility servers and mobile devices each hold a subset of the central database and sync with central on a schedule.
A sync is a session: the client pushes the changes it has made, then pulls the changes central holds for it.
This spec covers the parts that apply to every sync; `lookup-table.md` covers how central assembles what a client can pull, and `phases.md` covers the phases a facility's first sync runs in.

## Sessions

- [ ] A client syncs within a session, and runs one session at a time.
- [ ] Central runs a limited number of concurrent sessions, and a client that requests one while central is at capacity is queued rather than refused.
- [ ] The sync queue is ordered by how far behind each client is, so the client that has pulled up to the earliest tick is admitted first.
- [ ] A client may mark a request as urgent, which takes precedence over queue order.
- [ ] A client that reconnects while central still holds an incomplete session for it has that session closed out before its new one starts.

## Pulling changes

- [ ] A client pulls the changes central holds for it since the tick its last successful pull reached, which is its pull cursor.
- [ ] A client that has never completed a pull has no cursor, and pulls from the beginning of the sync timeline.
- [ ] Central assembles the records a session will pull into a snapshot taken at a single point on the sync timeline, and reports the tick it snapshotted up to.
- [ ] A client pulls its snapshot a page at a time, and each page resumes from a cursor derived from the last record of the page before it.
- [ ] A client stages the records it pulls, then saves them to its own tables in one transaction, so its database is never partway through a pull's worth of changes.
- [ ] A client's pull cursor advances only in the transaction that saves the records it accounts for, so a pull that fails at any point is repeated in full and no records go unaccounted for.
