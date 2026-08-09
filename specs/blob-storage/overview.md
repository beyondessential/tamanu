---
id: BLOB
---

# Content-addressed blob storage

Attachments and assets are stored on the filesystem as content-addressed blobs
rather than as binary columns in the database. Each record holds a hash of its
binary data; the bytes live in a blob store on disk, keyed by that hash. This
keeps large binary data out of the database and out of the change log, where
write-once files would otherwise be duplicated on every row snapshot.

The blob store is a general primitive with its own storage model, transfer
mechanism, and integrity guarantees. Attachments and assets are its consumers.

The specs in this area cover:

- `content-addressing.md` — how blobs are identified, stored, and recorded
- `transfer.md` — how bytes move between servers, and the content-pending state
- `facility-cache.md` — the facility and mobile outbox-and-cache store
- `capacity.md` — protecting the host's disk from the store
- `reclamation.md` — when blobs are reclaimed
- `access-control.md` — who may read and push blobs
- `serving.md` — serving blobs to clients
- `attachments.md` — attachments as blob references
- `assets.md` — the assets table as a blob store consumer
- `backups.md` — backing up and restoring the store
- `integrity.md` — verification, scrubbing, and self-heal
- `antivirus.md` — optional malware scanning
- `error-correction.md` — optional parity for redundancy-less storage
