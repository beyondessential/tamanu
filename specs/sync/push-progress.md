---
id: PUSH
---

# Push progress tracking

Central records how far each sync client has pushed to it, and hands that record back as a check on the client's own cursor. A sync client — a facility server or a mobile device — pushes its local changes to central in sync tick order; the point it has reached is a *push cursor*, a client-local sync tick meaning every change stamped at or before it has been delivered to central. Clients own their sync state; central's record is a cross-check against what it has actually received, which catches the case where the two have diverged — a database restored from a snapshot, say — so that no change is quietly skipped. See `sync/overview.md` for the cursor model across both directions.

## Recording push progress

- [ ] Central records a push cursor per sync client, identified by the client's device.
- [ ] The cursor is the client-local sync tick up to which central has durably persisted that client's pushed changes.
- [ ] Central advances the cursor only when the pushed changes are persisted, in the same transaction that saves them, so an interrupted or failed push never advances it.
- [ ] A client reports the cursor it has reached as part of completing a push.
- [ ] A client reports a cursor only when it has delivered every change it holds stamped at or before that tick. A client that pushes only some of its tables reports none, because the cursor would otherwise advance past records that were never persisted.
- [ ] An idle sync with nothing to push still reports the cursor, so central's record advances in step with the client rather than lagging to the last non-empty push.
- [ ] A client's push cursor on central only ever moves forward; a reported value lower than the stored one leaves it unchanged, since re-pushing from an earlier point does not reduce what central has received.
- [ ] A reported cursor that is not a whole sync tick is discarded and recorded in central's logs, leaving the stored cursor unchanged.

## Resuming a push

- [ ] At the start of a sync, central provides the client the cursor it holds for that client.
- [ ] The client resumes pushing from the lower of central's cursor and its own locally recorded push cursor.
- [ ] When central holds no cursor for the client, the client resumes from its own recorded push cursor alone.
- [ ] A client continues to record its own push cursor locally, advancing it as each push completes.

## Consistency after a snapshot restore

- [ ] A client whose database is restored from a snapshot ahead of central re-pushes the changes central has not persisted, rather than treating them as already delivered.
- [ ] A client whose database is restored from a snapshot behind central still delivers every change central has not persisted.
- [ ] No change committed on a client is treated as pushed until central has persisted it.
