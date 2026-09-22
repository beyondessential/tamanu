---
id: RECL
---

# Blob reclamation

Blobs are retained for as long as any record references them. Because clinical
records are soft-deleted rather than removed, a blob stays referenced — and
therefore retained — even after the records that use it are deleted. Reclamation
only ever removes blobs that nothing references.

## Central orphan collection

**Deferred: nothing implements this section, and no card in the epic claimed it.**
The criteria below stand as the specification; they are not built.

Deferring is safe in a way that building it carelessly is not. Central accepts a
blob only once a record references it, and records are retained rather than
deleted, so orphans arise only from anomalies: an interrupted upload, or a
reference repointed at new content. Not collecting them costs disk. Collecting the
wrong one costs a clinical attachment whose bytes are gone from the authoritative
copy, which restoring the database alone does not recover.

Two properties of the store make that sharper than it looks, and whatever
implements this has to answer both:

- Admission is content-addressed and idempotent, and re-admitting content that is
  already held does not refresh the existing row's admission time. So an age-based
  safety window does not cover content first seen long ago and deduplicated onto
  again a moment before its new reference commits: the pass sees an old blob with
  no reference, and the reference lands while it is being deleted.
- The changelog is never pruned, so content that ever had a reference row stays
  named by an entry forever. A liveness check that reads the changelog can only
  collect content that never acquired a reference at all, which leaves the
  repointed-asset case below uncollectable in practice.

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
- [ ] A blob awaiting its push is never evicted: it stays in the outbox until the
  central server acknowledges it. Content no record references is demoted out of
  the outbox and reclaimed with the rest of the cache, whether or not the central
  server ever received it.
