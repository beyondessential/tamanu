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
- The sync server's listeners are set independently of the API server's, which `BIND_ADDRESS` and `PORT` set.
- The server's container images set `SYNC_BIND_ADDRESS` to every interface on port 4100.
- The other parts reach the sync server at `localhost` by default, trying each address it resolves to.

> [!NOTE]
> Only the facility server's own parts need the sync server, so it listens where only they reach it. Both loopback addresses are tried because a host may have only one of IPv6 or IPv4. Parts running in separate containers reach each other over the container network rather than loopback, so the images listen on every interface.
