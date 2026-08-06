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
- [ ] The channel comprises three operations, each keyed by hash: probe a hash's
  availability without transferring bytes, fetch a blob's bytes, and offer a
  blob's bytes for push.
- [ ] Transfer is by hash: a server offers or requests a specific hash, and the
  receiving server verifies the delivered bytes against that hash before storing
  them.
- [ ] Transfer is idempotent: a server offered or asked for content it already
  holds skips the byte transfer.
- [ ] The operations are direction-neutral, but transfer connections are always
  established from the facility or mobile server to the central server, matching
  record sync. The central server acquires bytes through an origin's push; every
  other server acquires them through fetch.
- [ ] Blob content streams in both directions; a blob is never buffered whole in
  memory to be transferred.
- [ ] A transfer interrupted in either direction resumes from the bytes already
  delivered rather than restarting. Verification on receipt always covers the
  complete blob, including any part delivered before an interruption.
- [ ] Many small blobs transfer efficiently as concurrent requests multiplexed
  over a shared facility-to-central connection; the channel defines no batch
  operations of its own.

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
- [ ] The central server acknowledges a pushed blob only once its bytes have been
  verified against the hash and durably stored, so an acknowledgement is a safe
  signal to release the origin's durable copy.
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
- [ ] The transfer channel's probe reports the same availability states, so a
  server can learn whether a peer holds a hash, and why not, without requesting
  the bytes.
- [ ] A content-pending reference resolves to available once the serving server
  holds the blob.

## Undelivered blobs

- [ ] A reference that remains content-pending on the central server beyond an
  operational threshold is surfaced for attention, since its origin may be
  unreachable.
