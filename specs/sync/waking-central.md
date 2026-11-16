---
id: SYNCHK
---

# Syncing with a waking central

Applies to a facility server or a mobile device whose sync reaches central while central is [waking from sleep](../platform/supervisor/sleep-and-wake.md#waking).

## While central wakes

- A waking central answers `503 Service Unavailable` with a non-empty `Retry-After` header.
- A sync that gets that answer before its session opens, whether to the session start or to the login or token refresh before it, waits in line as a sync that central has queued for a later turn does. It ends without a session, and the next scheduled sync tries again.
- Waiting for a waking central is not a failed sync. A facility server records the attempt in its [run history](run-history.md#outcomes) as queued.
- A `503 Service Unavailable` without a `Retry-After` header, or with an empty one, is a failed sync.

> [!NOTE]
> A `503` with no `Retry-After` comes from an overloaded central or a proxy with nothing behind it, which say nothing about when to try again, so only the header marks a central that is waking.
