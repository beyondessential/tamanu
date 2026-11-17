---
id: SYNC
---

# Sync

Applies to multi-directional data synchronisation between central, facility, and mobile servers.

## Primary timezone

- A facility server and its central server share one primary timezone.
- Central reports its primary timezone when a facility server logs in to it to sync.
- A facility server whose primary timezone differs from central's stops, with an error naming both timezones, rather than sync or serve.
- A facility server that cannot reach central runs on its own primary timezone until it next logs in to central.

> [!NOTE]
> Synced datetimes are stored as strings in the primary timezone, with no offset. A facility on a different timezone from central would read and write every one of them shifted, so a mismatch stops the server before any are exchanged.
