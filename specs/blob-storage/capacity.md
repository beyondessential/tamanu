---
id: CAP
---

# Blob store disk usage

The blob store shares a host with the database and the rest of the system, and must
never consume the disk space they need. This guarantee overrides the cache size
budget: protecting the database and the system always takes priority over storing a
blob.

## System free-disk floor

- [ ] The blob store keeps the host's free disk space above a configured reserve at
  all times, measured against actual free space on the volume rather than the
  store's own size, so that growth in the database or other consumers is accounted
  for.
- [ ] As free disk approaches the reserve, the blob store reclaims space by evicting
  cache before any other measure (see `facility-cache.md`).
- [ ] When evicting cache cannot keep free disk above the reserve — because
  un-evictable outbox content is consuming the space — the blob store refuses to
  admit new blobs rather than cross into the reserve, so a new upload or push is
  rejected before the database can be starved.
- [ ] A refused admission fails the submitting operation immediately with an error
  identifying storage capacity as the cause, so an upload fails visibly at the time
  it is attempted and its consumer can present the failure to the user.
- [ ] The floor applies wherever the blob store runs, including the central server,
  whose store grows without deletion and must not starve the central database.

## Siting the store

- [ ] The blob store root is configurable so it can be placed on a separate volume
  from the database, removing disk contention. Where the store shares a volume with
  the database, the free-disk floor is what protects the database.

## Backpressure signals

- [ ] Outbox health is measured relative to sync progress, not wall-clock time
  alone. A blob that stays unacknowledged while the facility cannot reach the central
  server is expected accumulation; a blob that survives several successful sync
  cycles without being pushed is a severe dysfunction, because the connection is
  working but the push path is not.
- [ ] Outbox backpressure is surfaced as a health signal visible to central-side
  monitoring, escalating with both the number of successful sync cycles a blob has
  gone unpushed and the space the outbox is consuming.
