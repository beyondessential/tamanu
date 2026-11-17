---
id: SYNC
---

# Sync

Applies to multi-directional data synchronisation between central, facility, and mobile servers, and to the sync sessions through which a facility server or mobile device exchanges changes with central.

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
