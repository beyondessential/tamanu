---
id: RECL
---

# Blob reclamation

Blobs are retained for as long as any record references them. Because clinical
records are soft-deleted rather than removed, a blob stays referenced — and
therefore retained — even after the records that use it are deleted. Reclamation
only ever removes blobs that nothing references.

## Central orphan collection

- The central server reclaims only orphaned blobs: those referenced by no record,
  whether live or soft-deleted.
- Liveness is derived by comparing the stored blobs against the hashes referenced
  across the reference tables, not from a maintained reference count.
- A blob is eligible for collection only when it is unreferenced and older than a
  safety window, so a blob received before its reference has committed or synced is
  not collected.
- Orphans arise from interrupted uploads or abandoned transactions.

## Facility and mobile reclamation

Facility and mobile servers hold blobs as a bounded cache and reclaim space by
evicting cached blobs under a least-recently-used and size budget, never by orphan
collection. A blob that is not yet durable on the central server is never evicted.
