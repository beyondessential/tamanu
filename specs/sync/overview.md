---
id: SYNC
---

# Sync

Multi-directional data synchronisation between central, facility, and mobile servers.

## Sync cursors

Clients own their sync state: a client — a facility server or mobile device — records how far it has pulled from central, and how far it has pushed. Central additionally records how far each client has pushed to it, and hands that back as a cross-check the client validates its own push cursor against. That check is what keeps a push correct when a database is restored from a snapshot that diverges from the other side. Push progress is specified in `sync/push-progress.md`.
