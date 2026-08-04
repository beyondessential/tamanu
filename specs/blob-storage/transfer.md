---
id: XFER
---

# Blob transfer

Blob bytes move between servers separately from the records that reference them. A
record carries only its blob's hash when it synchronises; the bytes are resolved
over a dedicated transfer channel, so a large file never travels inside a sync
session and never holds up the records around it.

## Transfer channel

- [ ] Bytes move over a channel separate from record synchronisation, in both
  directions.
- [ ] Transfer is by hash: a server offers or requests a specific hash, and the
  receiving server verifies the delivered bytes against that hash before storing
  them.
- [ ] Transfer is idempotent: a server offered or asked for content it already
  holds skips the byte transfer.

## Fetch

- [ ] A server that holds a reference but not its bytes resolves them on demand and
  in the background from a server that holds them.
- [ ] The central server is the authoritative store and the default source for a
  fetch; a facility may also serve a blob it currently holds.
- [ ] A failed or interrupted fetch is retried, and never blocks the record that
  triggered it.

## Push

- [ ] A blob's referencing record synchronises to the central server before the
  blob is pushed, so the central server already expects the blob when it arrives
  (see `access-control.md`).
- [ ] A server that originates a blob delivers its bytes to the central server over
  the transfer channel.
- [ ] The origin retains the only copy durably in its outbox until the central
  server acknowledges the blob as stored, after which the copy becomes evictable
  (see `reclamation.md`).
- [ ] A push interrupted by restart or lost connectivity resumes; the origin
  re-offers the blob until it is acknowledged.

## Blob availability

- [ ] A record that references a blob synchronises normally whether or not its
  bytes have reached the servers involved; records are never held back to wait for
  their blobs.
- [ ] Each server determines locally whether it holds the bytes for a referenced
  hash. A reference whose bytes are absent on the serving server is content-pending.
- [ ] A content-pending reference is surfaced as an existing file awaiting its
  bytes, rather than as a missing or absent record.
- [ ] The serving server's response makes the availability state evident and
  distinguishes whether the content is awaiting upload from its origin or awaiting
  fetch by the serving server, so a client can differentiate the cases without a
  further request.
- [ ] A content-pending reference resolves to available once the serving server
  holds the blob.

## Undelivered blobs

- [ ] A reference that remains content-pending on the central server beyond an
  operational threshold is surfaced for attention, since its origin may be
  unreachable.
