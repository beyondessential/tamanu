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
- [ ] The scrub also checks referential integrity: every hash referenced by a record
  has a present blob. A referenced blob that is missing is reported the same way as a
  corrupt one.

## Self-heal

- [ ] A corrupt or missing blob that is a replica — a facility cache copy, durable
  elsewhere — is repaired by re-fetching it, and is treated as a low-severity,
  self-correcting event.
- [ ] A corrupt or missing blob that is an authoritative copy — on central, or an
  outbox blob that is the only copy — is quarantined, escalated for attention, and
  repaired from the cheapest available source in order: local error correction where
  present, a peer holding the hash, then a backup.
- [ ] A quarantined blob is retained rather than deleted, so it remains available for
  investigation and is never served.
