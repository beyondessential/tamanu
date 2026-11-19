---
id: SYNC
---

# Sync

Applies to multi-directional data synchronisation between central, facility, and mobile servers, and to the sync sessions through which a facility server or mobile device exchanges changes with central.

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

## Starting a session

- A sync session is started by a logged-in user on a device holding the sync client scope, for the facilities the request names.
- Central refuses to start a session unless the user may sync and may access every facility it names.
- Starting a session completes any session the same device still has open.

## Session ownership

- A session belongs to the user and device that started it.
- Each step of a session, from waiting for it to be ready through pulling, pushing, reporting an error and ending it, is served only to that user on that device, and refused to any other.

> [!NOTE]
> The user's facility access is checked once, when the session starts. Holding every later step to the same user and device is what carries that check through the rest of the session.

## Pulling

- A pull covers the facilities the session was started for.
- A pull may name some of the session's facilities, and then covers only those.
- A pull naming a facility the session was not started for is refused.
