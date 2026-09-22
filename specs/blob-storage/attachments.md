---
id: ATCH
---

# Attachments on the blob store

Attachments — user-uploaded documents, patient letters, survey photos, and lab
report PDFs — are references to content-addressed blobs. An attachment record
carries the hash of its content alongside its declared content-type and size; the
bytes live in the blob store (see `content-addressing.md`) and move between
servers over the transfer channel (see `transfer.md`).

## Attachment records

- [ ] An attachment record carries its own stable identifier, the hash of its
  content, the declared content-type, and the content size.
- [ ] The creating server assigns the attachment's identifier locally; creating an
  attachment does not depend on reaching another server.
- [ ] An attachment carries the patient linkage of the record it is created for
  and, where that record is pinned to a facility, that facility — copied on at
  creation — so the attachment's synchronisation scope matches its owning
  record's, including sensitive-facility restrictions.
- [ ] Attachment records synchronise as ordinary persistent records, carrying the
  hash and never the bytes; a facility retains its attachment records after they
  reach the central server.
- [ ] Attachments are registered as a blob reference source, so access to their
  blobs is authorised against the attachment's scope (see `access-control.md`).

## Content resolution

- [ ] An attachment's content is resolved by its hash from the blob store. A
  legacy attachment instead holds its bytes in the database row; a reader resolves
  the hash when one is present and the in-database bytes otherwise.
- [ ] Legacy attachments reside only on the central server and do not
  synchronise; a facility serves a legacy attachment by reading it through the
  central server.
- [ ] A new attachment always stores its content in the blob store; the
  in-database form is only ever read.

## Creating attachments

- [ ] A new attachment's bytes are admitted to the blob store of the server
  handling the creation, and the attachment record is created together with the
  admission, so an admitted blob always has its referencing record (see
  `facility-cache.md`).
- [ ] An attachment's recorded size is taken from the bytes actually admitted to
  the store, not from a caller's declaration.
- [ ] On a facility server — user document uploads on patients, encounters, and
  lab requests, and generated patient letters — the blob is admitted at the
  outbox tier and creation completes without central connectivity; the background
  pusher delivers the bytes afterwards.
- [ ] On the central server — lab report PDFs materialised from FHIR results, and
  other server-generated documents — the blob is admitted directly to the central
  store.
- [ ] The central server accepts hash-carrying attachment records arriving
  through synchronisation whatever server originated them; the bytes arrive
  separately over the transfer channel (see `transfer.md`).
- [ ] An upload larger than the configured maximum file size is rejected.
- [ ] An upload the store cannot admit without crossing the free-disk reserve is
  rejected with an insufficient-storage error (see `capacity.md`).

## Serving attachments

- [ ] Attachment content is served only through the attachment reference, to a
  user permitted to read that attachment (see `access-control.md`).
- [ ] A server serves attachment content from its local blob store; a facility
  that does not hold the bytes resolves them from the central server on demand
  and serves the content once resolved (see `transfer.md`). An attachment is
  reported content-pending only when its bytes cannot be promptly resolved.
- [ ] Attachment content is streamed, with range support; content served from the
  blob store carries the hash as its cache validator (see `serving.md`).
- [ ] A caller may request attachment content base64-encoded, for clients that
  consume the content inline rather than as a download, profile pictures and
  photo answers among them. Content past the inline size limit is refused this
  way, directing the caller to stream it instead (see `serving.md`).

## Content-pending attachments

- [ ] An attachment whose bytes cannot be promptly resolved presents as an
  existing file awaiting its content, with a single awaiting-content message
  regardless of whether the content is awaiting upload or awaiting fetch — the
  response distinguishes the two states (see `transfer.md`).
