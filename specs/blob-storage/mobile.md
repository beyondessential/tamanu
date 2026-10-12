---
id: MOB
---

# Blobs on mobile

A mobile device holds blobs the same way a facility server does: a content-addressed
store with an outbox tier for content it originated and an evictable cache tier for
everything else (see `facility-cache.md`). Records carry only the hash and
synchronise without their bytes; the bytes are fetched lazily, when something on the
device actually reads them. What differs on mobile is the scale of the storage the
store must live within, and that the device is the only holder of content it has
captured but not yet pushed.

## Records and bytes

- [ ] Attachment records synchronise in both directions, carrying the hash and never
  the bytes. A device pulls the attachment records for the patients within its
  synchronisation scope, the same scope as the records that reference them (see
  `attachments.md`).
- [ ] A device retains its attachment records after their bytes reach the central
  server; a record is not removed to reclaim space, since the record is what makes
  its content refetchable.
- [ ] A device holds no binary column for attachment content. The bytes live in the
  device's blob store and are reached through the record's hash.
- [ ] Records synchronise at their own pace whether or not the bytes have moved, so a
  large photo never holds up the survey response that references it.

## Capturing content

- [ ] Content captured on the device (like photos, uploads, etc) is admitted to the
  device's blob store at the outbox tier as part of the operation that creates its
  referencing record (see `facility-cache.md`).
- [ ] Capture completes without connectivity. It does not depend on a capacity check
  against the central server; the central server's own capacity governs the blob when
  it is pushed (see `capacity.md`).
- [ ] A capture the device's store cannot admit without crossing the free-disk reserve
  is rejected with an insufficient-storage error naming the device's storage as the
  cause (see `capacity.md`).
- [ ] Captured content is admitted to the store once and read back by hash, so the
  device does not keep a second copy outside the store.
- [ ] Captured content stays durable on the device until the central server
  acknowledges it as stored, after which it becomes evictable cache like any other
  content (see `transfer.md`).

## Reading content

- [ ] A read resolves the record's hash against the device's blob store. Content the
  device holds is read without connectivity, whether the device captured it or fetched
  it earlier.
- [ ] Content the device does not hold is fetched by hash over the transfer channel
  and admitted to the cache tier, so a later read of the same content needs no
  connectivity (see `transfer.md`).
- [ ] A read refreshes the content's recency, so content in use stays cached (see
  `facility-cache.md`).
- [ ] Content the device neither holds nor can fetch presents as an existing file
  awaiting its content, distinct from a record that is missing (see `transfer.md`).
