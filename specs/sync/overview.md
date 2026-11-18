---
id: SYNC
---

# Sync

Applies to multi-directional data synchronisation between central, facility, and mobile servers.

## The facility sync server

- A facility server's sync server is how the server's other parts start a sync and read its status, over HTTP. It runs in a process of its own, or alongside the API when the facility server runs as a single process.
- The sync server listens on the configured sync port at the machine's IPv6 and IPv4 loopback addresses.
- The sync server starts when it can listen on at least one of the two loopback addresses, and logs a warning naming any it could not. It fails to start when it can listen on neither.
- The `SYNC_BIND_ADDRESS` environment variable replaces the loopback addresses with its own comma-separated list of listeners, each an IPv4 or bracketed IPv6 host and port. Every listener it names must bind, or the sync server fails to start.
- When the sync server runs in a process of its own, `BIND_ADDRESS` and then `PORT` set its listeners as they do the API server's, and `SYNC_BIND_ADDRESS` takes precedence over both. The loopback addresses apply only when none of the three is set.
- When the sync server runs alongside the API, `BIND_ADDRESS` and `PORT` set only the API server's listeners.
- The other parts reach the sync server at `localhost` by default, trying each address it resolves to.

> [!NOTE]
> Only the facility server's own parts need the sync server, so it listens where only they reach it. Both loopback addresses are tried because a host may have only one of IPv6 or IPv4.
