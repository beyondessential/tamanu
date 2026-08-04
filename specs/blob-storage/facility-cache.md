---
id: CACHE
---

# Facility and mobile blob cache

A facility or mobile server keeps its blobs in a single content-addressed store
with two tiers, distinguished only by durability. The store is a local cache in
front of the central server: it holds what the server currently needs and refetches
anything it has dropped.

## Outbox and cache tiers

- [ ] Blobs originated on the server that the central server has not yet
  acknowledged as stored are held in the outbox. An outbox blob is the only durable
  copy of its content and is never evicted (see `transfer.md`).
- [ ] Once the central server acknowledges a blob, or once the server has fetched a
  blob the central server already holds, the blob is cache: durable elsewhere, and
  therefore evictable.
- [ ] The cache is disposable. It can be discarded in whole or in part without
  affecting record integrity, because references remain in the database and their
  bytes refetch on demand. Only the outbox carries durability, so only the outbox
  must survive.
- [ ] Outbox content always has a local referencing record; a blob whose reference
  is never created is not left in the outbox, where it could be neither pushed nor
  evicted.

## Eviction

- [ ] The cache tier is bounded by a configurable size budget. When the cache
  exceeds its budget, the least-recently-used blobs are evicted first.
- [ ] Recency is tracked per blob: any read of a blob's content refreshes it, so a
  blob stays cached while anything uses it, regardless of how many references point
  at it.
- [ ] Outbox blobs are never evicted and count against neither the cache budget nor
  eviction.
