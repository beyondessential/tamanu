---
id: RECL
---

# Blob reclamation

Blobs are retained for as long as any record references them. Because clinical
records are soft-deleted rather than removed, a blob stays referenced — and
therefore retained — even after the records that use it are deleted. Reclamation
only ever removes blobs that nothing references.

## Central orphan collection

- [ ] The central server reclaims only orphaned blobs: those referenced by no
  record, whether live or soft-deleted.
- [ ] Liveness is derived by comparing the stored blobs against the hashes
  referenced across the reference tables and carried in changelog entries, not
  from a maintained reference count.
- [ ] Content superseded on a mutable reference (an asset replaced by a later
  upload) remains referenced by the changelog entries that recorded it, so
  superseded content is retained rather than collected.
- [ ] A blob is eligible for collection only when it is unreferenced and older than
  a safety window, so a blob whose reference is momentarily absent during an
  operation is not collected.
- [ ] Because the central server accepts a blob only once a record references it, and
  records are retained rather than deleted, orphans are rare: they arise from
  anomalies such as interrupted or abandoned operations, or from a reference being
  repointed at new content, as when an asset is replaced (see `assets.md`). Orphan
  collection is a conservative safety net.

## Facility and mobile reclamation

- [ ] Facility and mobile servers hold blobs as a bounded cache and reclaim space
  by evicting cached blobs under a least-recently-used and size budget, never by
  orphan collection.
- [ ] A blob that is not yet durable on the central server is never evicted.
