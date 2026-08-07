---
id: BKUP
---

# Blob store backups

A backup of a Tamanu server covers both its database and its blob store, so that
restored records and the bytes they reference stay consistent. Facility backups in
particular are used to rehearse upgrades against a faithful copy of a real facility,
so they must capture the facility exactly, blob store included. Backup orchestration
is performed by the backup tool (bestool) rather than by the Tamanu server; this
spec defines the behaviour that orchestration must follow.

A server's database and its blob store are captured as one backup cycle: two
captures that belong together and are restored together. The database capture
carries the references and the blob registry, the store capture carries the bytes.

## Backup ordering

- [ ] A cycle captures the database first and the blob store second, so the store
  capture includes every blob the database capture references.
- [ ] Because blobs are immutable and are not removed while referenced, a store
  capture taken after the database capture is a superset of what the database
  references; any blob it holds without a matching reference is a harmless orphan.
- [ ] The store capture does not begin until the database capture has frozen the
  data it represents, since a store captured before the database can lack bytes for
  a reference the database already holds.
- [ ] The two captures of a cycle are identifiable as a pair, so a restore can
  select the store capture belonging with the database capture it restores.
- [ ] The store is captured while the server runs, without quiescing it and without
  a point-in-time snapshot of the volume beneath it. A blob is immutable once
  stored and appears in its final location atomically (see
  `content-addressing.md`), so a capture taken from the live store cannot observe a
  partial or changing blob, and a blob admitted during the capture is simply
  captured or not.
- [ ] The ordering guarantee rests on references being retained rather than removed.
  A reference that disappears between the two captures can leave its blob eligible
  for reclamation and so absent from the store capture; restore treats such a blob
  as content-pending rather than as corruption, so the worst case degrades to a
  recoverable state rather than a broken one.

## Incremental backup

- [ ] The blob store is backed up incrementally: because stored blobs are immutable
  and never rewritten, a cycle transfers only the blobs added since the previous
  cycle.
- [ ] Each store capture is complete in itself. It represents every blob present in
  the store when it was taken, and restoring it requires no earlier capture, so a
  blob that remains in the store remains recoverable from the most recent cycle
  however long ago it was added.
- [ ] Content already captured by an earlier cycle is not captured again, however
  many blobs in the store share it, since the store names blobs by content hash.

## Facility backups

- [ ] A facility backup includes the facility's blob store, not only its database,
  so that a restored facility reproduces the true state of the original rather than
  a state part-reconstituted by syncing from central.
- [ ] Both tiers of a facility store are captured (see `facility-cache.md`).
  Capturing the outbox is what makes the backup safe: an outbox blob is the only
  durable copy of its content, so a backup omitting it would lose content held
  nowhere else.
- [ ] Cache content is captured as well, so a restored facility serves what the
  original could serve without refetching it first. Content addressing keeps this
  inexpensive, since cache content the backup already holds is not transferred
  again.

## Central backups

- [ ] The central server's store is captured on the same cycle basis as a
  facility's. Its store holds the authoritative copy of every blob and grows
  without deletion, so its backup is the archive of all content the deployment
  holds.
- [ ] A central store backup is the dependable source for repairing a blob that is
  corrupt or missing on central and that no peer holds (see `integrity.md`).

## Restore

- [ ] Restoring a server restores its database and its blob store from one cycle:
  the database capture together with the store capture belonging to it.
- [ ] Where the store capture from that cycle is unavailable, a later store capture
  may be restored against an earlier database capture, since a later capture is
  still a superset of what the earlier database references. An earlier store capture
  is never restored against a later database capture.
- [ ] A restored server reconciles its store against its restored blob registry,
  because the two captures are taken at different moments and can disagree in either
  direction. Reconciliation is the scrub's, and is specified in `integrity.md`.
- [ ] A reference whose bytes are absent after a restore is content-pending rather
  than corrupt (see `transfer.md`). On a facility server it is fetched from central
  on demand and in the background. On the central server it is content that must be
  durably present, and is escalated and repaired as `integrity.md` describes.
- [ ] A restored facility outbox is drained by the background pusher as normal, so
  blobs the original facility had not yet delivered are delivered after the restore
  (see `facility-cache.md`).
- [ ] A blob restored without a referencing record is left in place. On the central
  server it is reclaimed by orphan collection; on a facility server it is cache, and
  is evicted under the cache budget like any other (see `reclamation.md`).
