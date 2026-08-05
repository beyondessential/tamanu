# Facility blob outbox and LRU cache — test cases

Scenarios verifying the facility store's two-tier outbox/cache behaviour, the
background pusher, eviction, and disk backpressure. Most are automatable against
the blob store and facility server with a stubbed or test central; the Windows
eviction case and the monitoring checks are manual. Transfer-protocol internals
are F2's coverage; consumer wiring is J2/K2's.

## Outbox and cache tiers

- [ ] Create a blob with its referencing record in one operation; the blob lands in the outbox tier in the local registry (verifies spec: CACHE)
- [ ] Attempt to admit a blob without creating a referencing record; the store rejects it and nothing is left in the outbox (verifies spec: CACHE)
- [ ] Restart the facility server with un-pushed blobs in the outbox; the blobs and their outbox state survive the restart (verifies spec: CACHE)
- [ ] Push a blob and receive central's acknowledgement; the blob demotes from outbox to cache in the registry and becomes evictable (verifies spec: CACHE)
- [ ] Fetch a blob central already holds; it is admitted directly as cache tier (verifies spec: CACHE)
- [ ] Create a new local reference to content already held as cache; the blob stays cache and is not re-admitted to the outbox (verifies spec: CACHE)
- [ ] Evict a cached blob, then read it via its reference; the bytes are refetched on demand and serve correctly (verifies spec: CACHE, XFER)
- [ ] Confirm the `blobs` registry rows carry no sync tick movement and produce no changelog entries when tier or recency state changes (verifies spec: CAS)

## Background pusher

- [ ] With eligible outbox blobs present, the pusher delivers them to central on its schedule without a sync session running (verifies spec: CACHE)
- [ ] A blob whose referencing record has not yet synchronised is not offered to central (verifies spec: CACHE)
- [ ] Once the referencing record syncs, the same blob becomes eligible and is pushed on the next pass (verifies spec: CACHE)
- [ ] With several eligible blobs queued, offers go oldest-first (verifies spec: CACHE)
- [ ] Make central refuse one blob's offer; the pusher continues with the next eligible blob and re-attempts the refused one on a later pass (verifies spec: CACHE)
- [ ] Trigger the pusher while a blob's transfer is still in flight (slow transfer); no second concurrent transfer starts for that blob (verifies spec: CACHE)
- [ ] Restart the facility server mid-push; the push is re-offered after restart and the blob stays outbox until acknowledged (verifies spec: XFER)
- [ ] Kill connectivity mid-push, restore it; the push resumes or re-offers until acknowledged, and exactly one copy ends up stored on central (verifies spec: XFER)

## Eviction and recency

- [ ] Fill the cache past its budget; the least-recently-used blobs are evicted first, in recency order (verifies spec: CACHE)
- [ ] Read an old cached blob, then trigger eviction; the freshly read blob survives while less recently read blobs are evicted (verifies spec: CACHE)
- [ ] Admit a blob that pushes the cache over budget; admission itself evicts LRU blobs until the new blob fits (verifies spec: CACHE)
- [ ] Leave the cache over budget without admissions; the periodic background check brings it back under budget (verifies spec: CACHE)
- [ ] With the cache at budget and outbox blobs present, run eviction; outbox blobs are untouched and do not count against the budget (verifies spec: CACHE)
- [ ] Fetch a blob larger than the entire cache budget; it is admitted, serves reads, and is not evicted while it is the most recently used blob (verifies spec: CACHE)
- [ ] Begin streaming a large cached blob, trigger eviction selecting it; the read completes and removal happens only afterwards (verifies spec: CACHE)
- [ ] Repeat the in-progress-read eviction case manually on a Windows/NTFS deployment, where deleting open files fails (verifies spec: CACHE)
- [ ] Change the cache budget setting for a facility; the new budget takes effect without a restart and the next enforcement pass honours it (verifies spec: CACHE)

## Disk backpressure

- [ ] Shrink free disk toward the reserve with cache present; the store evicts cache to hold the floor before refusing anything (verifies spec: CAP)
- [ ] Fill the volume with un-evictable outbox content so eviction cannot hold the floor; a new upload is refused immediately with an error identifying capacity as the cause (verifies spec: CAP)
- [ ] Refuse a background fetch for capacity; the reference remains content-pending and the fetch retries once space is available (verifies spec: CAP, XFER)
- [ ] Hold a blob eligible-but-unpushed across several successful sync cycles; the outbox health signal escalates and is visible to central-side monitoring (verifies spec: CAP)
- [ ] A large blob actively mid-transfer across several sync cycles is reported as healthy accumulation, not dysfunction (verifies spec: CAP)
- [ ] A blob whose referencing record has not synced does not advance the dysfunction measure regardless of sync cycles (verifies spec: CAP)

## Operational

- [ ] Crash the facility server after reads but before recency flush; on restart the cache still serves and evicts sanely, with only eviction ordering degraded
- [ ] Soak: run sync, pusher, reads, and eviction concurrently for an extended period; registry, disk contents, and tiers stay mutually consistent (no stranded outbox blobs, no cache rows without bytes)
