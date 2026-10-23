---
id: SYNC
---

# Sync

Multi-directional data synchronisation between central, facility, and mobile servers.

## Sync cursors

Each direction of sync has a cursor owned by the receiver of the data. A client — a facility server or mobile device — records how far it has pulled from central. Central records how far each client has pushed to it. Making the receiver the authority on what it has received keeps the cursors correct when a database is restored from a snapshot that diverges from the other side. Push progress is specified in `sync/push-progress.md`.
