---
id: BLAC
---

# Blob access control

Access to blob content is authorised at the reference layer, not the blob layer.
Holding or knowing a hash grants nothing; a request is authorised against the
records that reference the blob. The blob store is never exposed as a
content-addressed endpoint that serves any hash to any caller. Server-to-server
transfer rides the same authenticated identity and data scoping as record
synchronisation, and push is sync-first: the central server accepts content only
once a synchronised record calls for it.

## End-user access

- [ ] A user may read a blob only through a reference they are permitted to read;
  the permission check is the one that governs the referencing record (for example,
  reading an attachment requires permission to read that attachment).
- [ ] The blob store is not directly reachable by end users; blob content is served
  only after a reference-level permission check.

## Transfer channel authentication

- [ ] Every transfer-channel operation (availability probe, fetch, offer, and
  content delivery) requires the authenticated device identity that record
  synchronisation requires; a request without it is refused.

## Server-to-server fetch

- [ ] A facility or mobile server may fetch from the central server only blobs
  referenced by records it is entitled to hold, applying the same data scoping as
  record synchronisation, including sensitive-facility restrictions.
- [ ] The central server authorises each fetch against the references it holds: a
  hash is served only when at least one record referencing it lies within the
  requesting server's synchronisation scope.
- [ ] Scoping applies to every operation that reveals content, so a hash outside
  the requesting server's scope is indistinguishable from a hash the central server
  does not hold: probing its availability and fetching its bytes answer as they
  would for absent content.
- [ ] The blob transfer channel does not widen data access beyond what record
  synchronisation already grants; this bounds peer healing too, since a facility
  can only ever supply blobs it was entitled to hold (see `integrity.md`).

## Server-to-server push

- [ ] The central server accepts a pushed blob only when it already holds a
  synchronised record, within the pushing server's data scope, that references the
  blob's hash; a push for a hash it does not expect is refused. Push shares fetch's
  scoping, so any server entitled to hold a blob may supply its bytes, which is
  what allows the central server to heal from a peer (see `integrity.md`).
- [ ] An unexpected push is refused the same way whether or not the central server
  holds the content, so the offer does not disclose what the central store holds.
- [ ] Refusal applies from the first byte: content for an unexpected hash is not
  staged even partially, so pushed storage, transient or admitted, is bounded by
  what synchronised records reference and the push channel cannot grow the central
  store beyond what its own records call for.
- [ ] A blob is pushed only after its referencing record has synchronised, so the
  central server never accumulates unreferenced pushed content; the origin's
  background pusher enforces this by offering only blobs whose referencing records
  have synchronised (see `facility-cache.md`).
