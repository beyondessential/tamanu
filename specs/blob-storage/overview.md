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
See `content-addressing.md` for how blobs are identified and stored.
