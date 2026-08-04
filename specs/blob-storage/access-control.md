---
id: BLAC
---

# Blob access control

Access to blob content is authorised at the reference layer, not the blob layer.
Holding or knowing a hash grants nothing; a request is authorised against the
records that reference the blob. The blob store is never exposed as a
content-addressed endpoint that serves any hash to any caller.

## End-user access

- [ ] A user may read a blob only through a reference they are permitted to read;
  the permission check is the one that governs the referencing record (for example,
  reading an attachment requires permission to read that attachment).
- [ ] The blob store is not directly reachable by end users; blob content is served
  only after a reference-level permission check.

## Server-to-server fetch

- [ ] A facility may fetch from the central server only blobs referenced by records
  that facility is entitled to hold, applying the same data scoping as record
  synchronisation, including sensitive-facility restrictions.
- [ ] The blob transfer channel does not widen data access beyond what record
  synchronisation already grants.

## Server-to-server push

- [ ] The central server accepts a pushed blob only when it already holds a record,
  synchronised from that facility, that references the blob's hash; a push for a hash
  it does not expect is refused.
- [ ] A blob is pushed only after its referencing record has synchronised, so the
  central server never accumulates unreferenced pushed content.
