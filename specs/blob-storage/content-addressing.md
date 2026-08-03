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

- [ ] Content is hashed with BLAKE3.
- [ ] A hash is stored as an algorithm-tagged lowercase value: `blake3:` followed
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
  filename (e.g. `blake3/ab/cd/<rest>`).
- [ ] Path components use lowercase hex so the layout is stable on case-insensitive
  filesystems.
- [ ] The fan-out keeps the number of entries per directory bounded on all
  supported filesystems.

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
