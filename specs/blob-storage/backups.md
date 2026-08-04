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

## Backup ordering

- [ ] A backup captures the database first and the blob store second, so the store
  snapshot includes every blob the database snapshot references.
- [ ] Because blobs are immutable and are not removed while referenced, a store
  snapshot taken after the database snapshot is a superset of what the database
  references; any blob it holds without a matching reference is a harmless orphan.

## Incremental backup

- [ ] The blob store is backed up incrementally as the set of hashes added since the
  previous backup, since stored blobs are immutable and never rewritten.

## Facility backups

- [ ] A facility backup includes the facility's blob store, not only its database,
  so that a restored facility reproduces the true state of the original rather than a
  state part-reconstituted by syncing from central.

## Restore

- [ ] Restoring a server restores its database and its blob store together. A blob
  present in the store without a referencing record is left in place and reclaimed by
  orphan collection (see `reclamation.md`).
