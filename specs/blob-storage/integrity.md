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
