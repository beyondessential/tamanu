# Mobile blob storage and lazy fetch

Aligns the mobile app's attachment model with the blob transfer subprotocol. Mobile
already keeps attachment bytes on the filesystem, so the shape of this card is
replacing the inline-bytes sync path with hash-carrying records plus lazy fetch, and
putting the device store under a bounded cache.

## Where mobile is today

`packages/mobile/App/models/Attachment.ts` holds `data` (blob), `filePath`, and
syncs `PUSH_TO_CENTRAL`; the server-side model is `PUSH_TO_CENTRAL_THEN_DELETE`. An
`@AfterLoad` hook reads the file off disk into a Buffer purely so the bytes ride
inside the sync record, with a comment noting SQLite cannot select large blobs. The
model's own TODOs name the two debts this card closes: orphaned attachments sync
anyway, and nothing cleans up after a push.

Reads go through `ViewPhotoLink.tsx`: it looks for a local attachment row, and
failing that does a live `attachment/{id}` GET against central, showing "Images
require live internet for viewing" when offline. So today an attachment is viewable
offline only in the window before it has been pushed.

Capture goes through `UploadPhoto/index.tsx`, which calls
`health/canUploadAttachment` on central before accepting a photo. That check needs
connectivity, so capture is effectively online-only.

## How mobile learns a hash

Mobile pulls attachment records rather than resolving an id to a hash on demand.

J2 gives attachment records the patient linkage of the record they were created for,
so their sync scope matches their owning record's. That makes attachments poolable
into mobile's existing patient scope, the same way survey responses and answers
already sync bidirectionally. Mobile then holds the hash locally and goes straight to
the fetch-by-hash channel, with no resolution round trip and no new endpoint.

The alternative considered was keeping the id-keyed path and having central resolve
id to hash. It was rejected because it costs a request before every cold read and
keeps a mobile-only path alongside the general transfer channel. It was the better
option only under today's schema, where attachments carry no patient association at
all and so cannot be sync-scoped; J2 removes that constraint.

This makes mobile's attachment sync direction bidirectional, and means attachment
records are retained on the device rather than deleted after push, since the record
is what makes the content refetchable.

## Cache budget on a device

Derived from the device's own storage rather than configured. Fleet devices vary too
widely for one figure, and there is no administrator per device to set one the way
there is per facility. The budget is re-derived as device storage changes, so a
device filling with unrelated data yields cache rather than holding a budget it
cannot afford. The free-disk floor stays the hard bound.

## Integrity on a device

No scheduled scrub: the device is battery-powered and intermittently awake, and its
cache is disposable. Receipt and read verification carry it. The exception is the
outbox, where the device holds the only copy of captured content, so an outbox blob
is verified before it is offered. That turns local corruption into a surfaced fault
rather than a push that is refused over and over.

## Status

Unblocked. J2 merged into the epic branch (PR #10710) and this branch is rebased
onto it. The linkage landed as the spec assumed: `Attachment` carries its own
`patientId`/`encounterId`, syncs `BIDIRECTIONAL` with a patient filter over both
direct and encounter linkage, and only hash-carrying rows sync — legacy
in-row-bytes attachments stay central-only. The central model still accepts
mobile's inline-bytes upload as a legacy in-database attachment; retiring that
path is this card's work.

The spec-structure question is settled: mobile behaviour stays in its own spec.
`mobile.md` covers the device blob store as a whole (capture, budget, reading,
outbox durability), not just attachments; its Records and bytes section is the
device-side view of what `attachments.md` states product-wide, and the two
cross-reference each other.

## Notes

- Branch is based on `workhorse/b2` rather than `main`, matching siblings K2 and N2,
  so the `specs/blob-storage/` suite is present to edit.
- Mobile capture becoming offline-capable falls out of the outbox model, since the
  central capacity pre-check moves to push time. Worth calling out to testers as a
  behaviour change rather than an incidental one.
- S2 (sans-io blob package shared with mobile) is deliberately downstream of this
  card, so expect a server copy and a React Native copy of the store and transfer
  logic until the seams are drawn from two real callers.
