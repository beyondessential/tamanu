---
id: SYNRUN
---

# Facility sync run history

A facility server keeps a history of its sync attempts in its own database, one record per attempt, so that monitoring can tell whether sync is working. In particular, an attempt that hangs or never finishes is visible in the history, not just one that fails with an error.

## Recording an attempt

An attempt is recorded before it contacts the central server, and updated with its outcome when it ends. Only a sync that actually starts is recorded. A request made while a sync is already running waits for a later sync and shares it, and does not create a record of its own.

- [ ] Every facility sync attempt creates one run record, whatever triggered it (the schedule, a user, a patient being marked for sync, or the sync subcommand).
- [ ] A run record exists, marked as running and with no completion time, from the moment the attempt starts until it ends.
- [ ] An attempt that hangs, or whose server process stops before it ends, leaves its run record marked as running with no completion time.
- [ ] Callers that ask for a sync while one is already running, and share the single sync that follows it, produce one run record for that sync between them.
- [ ] A run record keeps what triggered the attempt (such as scheduled or user-requested) and whether it asked to be let in ahead of other facilities. It keeps no other trigger details, since those can identify users or patients.
- [ ] Once the central server has issued a session for the attempt, the run record holds that session's id.
- [ ] A run record holds when the attempt began saving pulled changes into the facility database, and when that save completed. The start of the save is visible while the save is still in progress, so an attempt stuck saving can be told apart from one stuck exchanging changes with the central server.

## Outcomes

- [ ] An attempt that completes is recorded as succeeded, with its completion time.
- [ ] An attempt that the central server queues for a later turn is recorded as queued, with its completion time and no session.
- [ ] An attempt that fails is recorded as failed, with its completion time and error message. The failure is still reported to whatever triggered the sync.
- [ ] If the outcome itself cannot be recorded, the attempt still succeeds or fails as it would have, and its run record stays marked as running.

## Storage

- [ ] Run records are local to the facility server: they are never synced to the central server and are not change-logged.
- [ ] Run records are kept indefinitely.
