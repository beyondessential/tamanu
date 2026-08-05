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
- [ ] That invariant is maintained at admission: a blob is admitted to the outbox
  only as part of the operation that creates its referencing record. Facility and
  mobile servers run no orphan collection (see `reclamation.md`), so admission is
  the sole guard against stranded outbox content.

## Background pusher

- [ ] A background pusher drains the outbox to the central server over the transfer
  channel (see `transfer.md`). It runs on its own schedule, independent of sync
  sessions.
- [ ] The pusher works oldest-first: the longest-unacknowledged blob is offered
  first.
- [ ] At most one transfer is in flight per blob; a blob whose push is already in
  progress is not offered again until that attempt concludes, so the same content
  is never uploaded twice concurrently.

## Eviction

- [ ] The cache tier is bounded by a size budget, an administrator setting scoped
  to the facility server. When the cache exceeds its budget, the least-recently-used
  blobs are evicted first.
- [ ] The budget is enforced when a blob is admitted — an incoming blob evicts
  least-recently-used cache until it fits — and by a periodic background check.
  Eviction driven by the host's free-disk floor is covered by `capacity.md`.
- [ ] Recency is tracked per blob: any read of a blob's content refreshes it, so a
  blob stays cached while anything uses it, regardless of how many references point
  at it.
- [ ] Recency updates may be coalesced rather than recorded durably on every read;
  losing the most recent refreshes (for example across a crash) degrades eviction
  ordering only, never correctness.
- [ ] Outbox blobs are never evicted and count against neither the cache budget nor
  eviction.
