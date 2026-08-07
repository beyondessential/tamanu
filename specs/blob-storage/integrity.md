---
id: SCRUB
---

# Blob integrity

Because a blob's hash names its content, any stored blob can be checked by
re-hashing it and comparing to the reference. The store detects corruption both on
the read path and proactively by scrubbing, and repairs it wherever a good copy can
be found.

## Verification

- [ ] A blob is verified against its hash when it is received, before it is stored
  (see `transfer.md`).
- [ ] A full read of a blob re-verifies its content against its hash; typical blob
  sizes make this inexpensive. A ranged read of a large blob relies on receipt
  verification and scrubbing rather than re-verifying each range.
- [ ] Corruption detected on any path triggers the self-heal response below.

## Scrub

- [ ] A scheduled scrub reads stored blobs and verifies each against its hash,
  covering blobs that are never read.
- [ ] The scrub is incremental and rate-limited: it verifies least-recently-scrubbed
  blobs first and records each blob's scrub time and result in the local registry, so
  that every blob is verified within a target cycle.
- [ ] The scrub runs on every server that stores blobs, central and facilities
  alike.
- [ ] The scrub also checks referential integrity for content that must be durably
  present on the server: every referenced, delivered blob on the central server, and
  every outbox blob on a facility. A blob absent in these cases is reported the same
  way as a corrupt one.
- [ ] Legitimately absent bytes are not a fault, and are neither reported nor
  proactively repaired: a blob still awaiting upload or fetch (content-pending, see
  `transfer.md`), or a cache blob that has been evicted (durable on central and
  refetched on demand, see `facility-cache.md`).
- [ ] Central separates the two by how long the reference has stood: push is
  sync-first, so every reference is briefly ahead of its bytes, and a reference is
  undelivered only once its record has been synchronised long enough that the
  upload should have followed. Within that window it is content-pending.

## Registry reconciliation

The registry is what makes a blob visible to the server, so content on disk that no
registry entry names is content the server cannot use. The scrub reconciles the two
in both directions: its verification pass walks the registry, and its reconciliation
pass walks the store.

- [ ] The scrub walks the store's own contents as well as its registry, so a blob
  present on disk but named by no registry entry is found.
- [ ] Such a blob is verified against the hash its location encodes and, where it
  matches, registered with its size, so its bytes become usable rather than
  remaining stranded on disk. Where it does not match, it is treated as corrupt.
- [ ] Reconciliation is necessary because an unregistered blob is otherwise
  permanent: it is never served, and it is never reclaimed, since a facility evicts
  against a budget derived from the registry and never collects orphans (see
  `reclamation.md`). It nonetheless occupies disk that the free-disk floor measures
  (see `capacity.md`).
- [ ] A registry entry naming bytes the store does not hold is recorded as absent,
  so the server acquires them rather than offering content it cannot serve. Bytes
  that are legitimately absent stay absent, as above.
- [ ] Reconciliation is how a restored server converges, its database and store
  having been captured at different moments (see `backups.md`), and how a server
  recovers from an admission interrupted between a blob reaching its location and
  being registered.

## Self-heal

- [ ] A corrupt replica — a facility cache copy whose bytes fail verification, the
  content being durable elsewhere — is repaired by re-fetching it, a low-severity,
  self-correcting event. A cache copy that is merely absent is not a fault and
  refetches on demand.
- [ ] A corrupt or missing blob that must be durably present — an authoritative copy
  on central, or an outbox blob that is the only copy — is quarantined, escalated for
  attention, and repaired from the cheapest available source in order: local error
  correction where present, a peer holding the hash, then a backup.
- [ ] For the central server a peer source is a facility that holds the blob within
  its data scope. Central cannot reach a facility on demand, so it heals from a peer
  opportunistically as facilities connect, and maintains no index of what facilities
  hold; a backup remains its dependable source.
- [ ] A quarantined blob is retained rather than deleted, so it remains available for
  investigation and is never served.
