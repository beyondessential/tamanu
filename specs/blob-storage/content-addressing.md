---
id: CAS
---

# Content addressing

Blobs are identified and stored by a cryptographic hash of their contents. A
record that needs binary data holds the hash of that data; the bytes live in the
blob store, retrieved by hash. Because the hash names the content, identical bytes
resolve to a single stored blob no matter how many records reference them, and any
retrieved blob can be verified by re-hashing it.

## Blob identity

- [ ] Content is hashed with SHA-256.
- [ ] A hash is stored as an algorithm-tagged lowercase value: `sha256:` followed
  by the lowercase-hex digest.
- [ ] Equal hash means equal content: a hash uniquely denotes its bytes, and a
  collision is treated as impossible.
- [ ] Empty (zero-byte) content has a defined hash and is stored like any other
  blob.
- [ ] The algorithm tag allows a future hash algorithm to be introduced alongside
  the existing one without ambiguity.

## Storage layout

- [ ] A blob's on-disk path is derived from its hash: the algorithm name, then a
  two-level fan-out of the first two bytes of the digest, then the remainder as the
  filename (e.g. `sha256/ab/cd/<rest>`).
- [ ] Path components use lowercase hex so the layout is stable on case-insensitive
  filesystems.
- [ ] The fan-out keeps the number of entries per directory manageable on all
  supported filesystems.

## Store interface

- [ ] The store exposes four operations keyed by hash: presence check, streamed
  retrieval, admission, and removal.
- [ ] Admission hashes the content the store has written, so a blob's recorded hash
  is always computed from the bytes actually stored rather than from a hash the
  caller supplied.
- [ ] Admission is idempotent: content whose hash is already stored is not stored
  again, and the existing blob is shared.
- [ ] Admission records the blob in the local registry with its size and integrity
  state.
- [ ] Content is written to a temporary file within the store, flushed, and moved
  into its fan-out path by an atomic rename, so a reader never observes a partial
  blob. This holds on Windows/NTFS as well as POSIX filesystems.

## Blobs and references

- [ ] A **blob** is content: its bytes and its size. Size is an intrinsic property
  of the blob, and the blob store is its source of truth.
- [ ] A **reference** is a record that points at a blob by hash — an attachment or
  an asset. A reference owns its own stable identifier, the hash it points to, its
  declared content-type, and its associations to the records that use it.
- [ ] Many references may point at one blob. Properties that can differ between
  those references — content-type, title, ownership — live on the reference; only
  intrinsic properties live on the blob.

## Blob registry

- [ ] Each server keeps a single `blobs` table recording the blobs it holds, their
  size, and their integrity state. This table is local to the server: it does not
  synchronise and does not record to the change log.
- [ ] On the central server the registry is the authoritative record of which
  content exists and its verification state.
- [ ] On a facility or mobile server the registry is a cache index: which blobs are
  present locally and their local state.
