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
- [ ] A blob is admitted to the outbox only as part of the operation that creates
  its referencing record, since facility and mobile servers reclaim nothing by
  orphan collection (see `reclamation.md`) and a stranded outbox blob would
  otherwise persist forever.
- [ ] Content already held in the cache tier remains cache when a new local
  reference to it is created: the tier reflects whether the central server holds
  the bytes, not where a reference came from.

## Background pusher

- [ ] A background pusher drains the outbox to the central server over the transfer
  channel (see `transfer.md`). It runs on its own schedule, independent of sync
  sessions.
- [ ] A blob becomes eligible for push once its referencing record has synchronised
  to the central server, which the origin determines from its own sync progress;
  the pusher offers only eligible blobs (see `access-control.md`).
- [ ] The pusher works oldest-first among eligible blobs: the longest-unacknowledged
  eligible blob is offered first.
- [ ] A refused or failed offer does not block the queue: the pusher continues with
  the next eligible blob and returns to the failed one on a later pass.
- [ ] At most one transfer is in flight per blob; a blob whose push is already in
  progress is not offered again until that attempt concludes, so the same content
  is never uploaded twice concurrently.

## Eviction

- [ ] The cache tier is bounded by a size budget; on a facility server the budget
  is an administrator setting scoped to the facility. When the cache exceeds its
  budget, the least-recently-used blobs are evicted first.
- [ ] The budget is a target, not a hard limit: a blob needed now is admitted even
  when it alone exceeds the budget. The hard bound on disk usage is the free-disk
  floor (see `capacity.md`).
- [ ] The budget is enforced when a blob is admitted — an incoming blob evicts
  least-recently-used cache until it fits — and by a periodic background check.
  Eviction driven by the host's free-disk floor is covered by `capacity.md`.
- [ ] Eviction never removes the most recently used blob merely to satisfy the
  budget, so a blob larger than the budget serves reads while it is in use rather
  than cycling through eviction and refetch.
- [ ] Eviction does not disrupt reading: a blob with a read in progress is removed
  only once that read completes.
- [ ] Recency is tracked per blob: admission sets its initial recency, and any read
  of its content refreshes it, so a blob stays cached while anything uses it,
  regardless of how many references point at it.
- [ ] Recency updates may be coalesced rather than recorded durably on every read;
  losing the most recent refreshes (for example across a crash) degrades eviction
  ordering only, never correctness.
- [ ] Outbox blobs are never evicted and count against neither the cache budget nor
  eviction.
