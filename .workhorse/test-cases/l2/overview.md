# Mobile blob storage and lazy fetch — test cases

Scenarios verifying mobile's hash-carrying attachment records, offline capture into
the outbox, lazy fetch on read, and the device-derived cache budget. Most are
automatable under the mobile Jest suites against a stubbed central, alongside the
existing `MobileSyncManager` tests. Anything turning on real device storage, low-end
hardware, or the OS reclaiming space is manual on a device. Store and transfer
internals are E2/F2's coverage; the facility-side tiers are G2's; attachment record
scoping is J2's.

## Records and bytes

- [ ] Sync an attachment record for a patient in the device's scope; the record
  arrives carrying the hash and no bytes (verifies spec: MOB)
- [ ] Sync a survey response with a photo answer; the response and answer sync at
  their own pace and are not held back waiting for the photo's bytes (verifies spec:
  MOB, XFER)
- [ ] An attachment for a patient outside the device's sync scope does not reach the
  device at all, record or bytes (verifies spec: MOB, BLAC)
- [ ] Push a device-originated attachment and receive acknowledgement; the attachment
  record is retained on the device rather than removed (verifies spec: MOB)
- [ ] Confirm no attachment sync payload carries binary content in either direction,
  at any size (verifies spec: MOB)
- [ ] Confirm the device's `blobs` registry neither syncs nor produces changelog
  entries as tier and recency change (verifies spec: CAS)

## Capturing content

- [ ] Capture a survey photo with the device fully offline; capture completes, the
  blob is admitted to the outbox, and the attachment record is created with it
  (verifies spec: MOB)
- [ ] Capture with the device offline, then restore connectivity; the record syncs and
  the pusher then delivers the bytes (verifies spec: MOB, CACHE)
- [ ] Confirm capture makes no capacity call to central and does not fail when central
  is unreachable (verifies spec: MOB)
- [ ] With central at its own capacity limit, capture on the device still succeeds and
  the refusal surfaces on push rather than at capture (verifies spec: MOB, CAP)
- [ ] Capture with device storage at the free-disk reserve; capture is rejected
  immediately with an insufficient-storage error naming device storage (verifies spec:
  MOB, CAP)
- [ ] After capture, confirm exactly one copy of the content exists on the device, in
  the store, with no second copy left in the documents directory (verifies spec: MOB)
- [ ] Kill the app between admitting the blob and creating its record; on relaunch no
  stranded outbox blob remains without a referencing record (verifies spec: MOB,
  CACHE)
- [ ] Captured content stays in the outbox and survives app restarts until central
  acknowledges it, then demotes to evictable cache (verifies spec: MOB, CACHE)

## Reading content

- [ ] Read an attachment the device captured, while offline; the content displays from
  the outbox with no network call (verifies spec: MOB)
- [ ] Read an attachment the device holds only as a record; the bytes fetch by hash
  and the content displays (verifies spec: MOB, XFER)
- [ ] Read the same attachment again after the first fetch, offline; it displays from
  cache with no network call (verifies spec: MOB)
- [ ] Read an attachment the device does not hold, while offline; it presents as an
  existing file awaiting its content, distinct from a missing record (verifies spec:
  MOB, XFER)
- [ ] Read an attachment whose bytes have not reached central yet; the awaiting-content
  state is reported and resolves once the bytes arrive (verifies spec: MOB, XFER)
- [ ] Two attachment records referencing identical content resolve to a single stored
  blob on the device (verifies spec: MOB, CAS)
- [ ] Read a cached blob, then trigger eviction; the freshly read blob survives while
  less recently read blobs go first (verifies spec: MOB, CACHE)
- [ ] Interrupt a fetch mid-transfer and retry; the fetch resumes and the content
  verifies against its hash before display (verifies spec: XFER, SCRUB)

## Device cache budget

- [ ] The cache budget is derived from the device's storage, and two devices with
  different capacity get different budgets (verifies spec: CACHE)
- [ ] Fill the device with unrelated data; the budget is re-derived downward and the
  cache gives space back (verifies spec: CACHE)
- [ ] Free space back up on the device; the budget is re-derived upward (verifies spec:
  CACHE)
- [ ] Exceed the budget with cached content; least-recently-used blobs evict first and
  their records remain, refetching on demand (verifies spec: CACHE, MOB)
- [ ] Fetch content larger than the whole budget; it is admitted, displays, and is not
  evicted while it is the most recently used blob (verifies spec: CACHE)
- [ ] With the cache at budget and outbox content present, run eviction; outbox
  content is untouched and does not count against the budget (verifies spec: CACHE)
- [ ] Fill the device with un-evictable outbox content so eviction cannot hold the
  free-disk floor; capture is refused rather than crossing the reserve (verifies spec:
  CAP)

## Integrity

- [ ] Corrupt a fetched cache blob on disk and read it; corruption is detected and the
  blob refetches rather than displaying wrong content (verifies spec: SCRUB)
- [ ] Corrupt an outbox blob on disk; the corruption is detected before the offer and
  surfaced on the device, and the push is not attempted repeatedly (verifies spec:
  SCRUB, MOB)
- [ ] Confirm the device runs no scheduled scrub and does no background hashing pass
  while idle (verifies spec: SCRUB)
- [ ] Deliver bytes that do not match the requested hash; the device rejects them and
  does not admit them to the store (verifies spec: XFER, SCRUB)

## Operational

- [ ] Run capture, sync, push, fetch, and eviction together on a low-end Android
  device; the app stays responsive and storage stays within the floor
- [ ] Kill the app mid-fetch and mid-push, repeatedly; the store, registry, and tiers
  stay mutually consistent with no stranded blobs and no records pointing at absent
  cache that cannot refetch
- [ ] Let the OS reclaim app storage under pressure; the cache degrades to refetch on
  demand and outbox content survives
- [ ] Soak an outreach-shaped run: capture many photos offline across a day, then sync
  on a poor connection; every captured blob reaches central exactly once
