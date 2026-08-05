# Facility blob outbox and LRU cache — plan

## Scope boundary with J2 (delete-after-push)

G2 builds the outbox, cache, and background pusher machinery inside the blob
store. It does not touch the attachments table or its sync path: `Attachment`
keeps `PUSH_TO_CENTRAL_THEN_DELETE` and `deleteRedundantLocalCopies.js` stays in
place until J2 rewires attachments onto the blob store. J2's rewiring is what
retires the delete-after-push mechanism for attachments; "replaces
delete-after-push" in this card's description means the outbox/cache model
supersedes that pattern at the store level, ready for consumers to adopt.

## Branch base

Spec work happens on top of B2 (`origin/workhorse/b2`). When this card moves to
implementation it should rebase onto F2's branch, which carries the blob store
primitive (E2) and the fetch-by-hash transfer subprotocol — both of which this
card builds on.

## Tech design notes

- **Pusher scheduling**: the pusher is its own scheduled task, not a hook on sync
  session completion, with a per-blob in-flight guard so a slow transfer is never
  raced by a second attempt at the same content (avoids duplicate uploads).
  Drains oldest-first.
- **Cache size budget**: a facility-scoped setting (`packages/settings/src/schema/facility.ts`),
  since it is only read on the facility server. Settings, not config files.
- **Recency tracking**: reads refresh recency, but updates may be coalesced in
  memory and flushed periodically rather than written to the registry per read.
  Approximate LRU ordering is acceptable; losing recent refreshes on crash only
  degrades eviction order.
- **Eviction execution**: enforced at admission (evict LRU until the incoming
  blob fits the budget) plus a periodic background check. Free-disk-floor
  eviction is the primitive's concern (E2 / `capacity.md`); the budget is this
  card's. The budget is a soft target: never refuse a needed blob, never evict
  the most-recently-used blob to satisfy it (anti-thrash for oversized blobs).
- **Push eligibility bookkeeping**: "referencing record has synchronised" is
  determined locally — a record is synced once it was included in a completed
  push session (its `updated_at_sync_tick` is at or below the last successfully
  pushed tick, and not flagged for re-push). The pusher queries eligibility
  rather than tracking it event-by-event, so it self-corrects across crashes.
- **Dysfunction signal**: count sync cycles from eligibility, exclude blobs with
  an actively progressing transfer. Needs per-blob bookkeeping of
  eligible-since and last-progress, which fits the local `blobs` registry.
