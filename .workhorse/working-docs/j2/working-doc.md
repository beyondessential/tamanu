---
status: draft
---

# Route attachments through the blob store

Drafting space for this card — behaviour, implementation options, open questions, trade-offs, and testing notes, developed together before the split.

## What the epic specs already cover

The blob layer is fully specified by the epic and needs no J2 work: identity, layout, and the reference model (`blob-storage/content-addressing.md`), transfer and the content-pending states (`blob-storage/transfer.md`), the outbox/cache tiers (`blob-storage/facility-cache.md`, being implemented by G2), reference-scoped access control (`blob-storage/access-control.md`), streaming/range/ETag serving (`blob-storage/serving.md`), and the disk floor (`blob-storage/capacity.md`). J2's spec work is the attachment-domain consumer wiring on top: the `hash` column, each write path's admission point, dual-read of legacy rows, and the awaiting-content presentation.

## Current write/read paths to rewire

- **User document upload** — web → facility `uploadAttachment.js` → synchronous base64 POST to central (`central-server/app/attachment.js`); fails offline. Used by patient documents, encounter documents, lab request attachments.
- **Patient letters** — `createPatientLetter.js` creates the Attachment locally on the facility; row pushes via `PUSH_TO_CENTRAL_THEN_DELETE`.
- **Survey photos** — mobile creates Attachment locally and syncs it inline (the mobile write path itself is L2's; central's ingest of those rows is J2-relevant). `SurveyResponse.ts` also creates attachments from base64 answer data server-side.
- **FHIR lab PDFs** — `FhirDiagnosticReport` creates Attachment + LabRequestAttachment directly on central.
- **Profile pictures** — read path: survey answer body holds an attachment id, facility fetches from central, always base64.
- **Web download** — facility `attachment.js` GET: local-then-central fallback, buffers the whole file, optional `base64=true` mode.

## Open questions

- [ ] **What exactly is "local hash-based id assignment"?** If the attachment id is derived from the content hash, two uploads of identical bytes collide into one attachment row — but CAS says references stay distinct (many references → one blob) and carry their own content-type/title. Is the intent deterministic ids (reference-level dedupe), or ordinary locally-assigned ids with the hash in a separate column? Also: id format must satisfy the existing `[A-Za-z0-9-]+` id constraint.
- [ ] **Attachment sync lifecycle.** Today attachments are `PUSH_TO_CENTRAL_THEN_DELETE` (facility deletes after push; mobile oddly syncs them). Do hash-carrying attachment rows become normally-synced records that persist on the facility? BLAC authorises blob access via sync_lookup scope of the referencing record, so the answer determines whether blob access control works at all for attachments.
- [ ] **Scoping gap for access control.** The attachments table has no patient or facility columns, so its sync_lookup entries would have null patient_id/facility_id — which passes BLAC's scope check for *every* facility. Does the hash column belong on attachments (accepting effectively-global blob scope), do attachments gain scoping columns, or should the registered blob-reference source be the owning record (document_metadata etc.) instead?
- [ ] **Central ingest of legacy inline rows.** During transition, mobile (pre-L2) still syncs attachment rows with inline bytea. Does central admit those bytes into the blob store on arrival (writer normalises) or leave them in-database for the backfill card (M2)?
- [ ] **Does `base64=true` survive?** Streaming/range serving replaces buffer-whole responses, but profile pictures and possibly other web callers rely on base64 JSON responses today.
- [ ] **Upload guards.** Today central checks free disk per upload (`canUploadAttachment`) and facility enforces `maxFileSize`. With CAP's disk floor at the store, what is the user-facing rejection behaviour, and does the maxFileSize setting stay?
- [ ] **Awaiting-content copy.** One message for a content-pending file for now — what should it say, and is the download action disabled or retryable? (Backend already distinguishes upload-pending from fetch-pending per XFER, so only presentation is at stake.)

## Implementation notes

- Facility upload order-of-operations must satisfy CACHE's invariant that outbox content always has a local referencing record: admit to the store (outbox tier) and create the attachment row together, so an abandoned upload can't strand an unevictable blob.
- G2 (facility outbox/LRU cache) will merge into B2 soon; J2's facility-side write path lands on its `BlobStore` tier API. Rebase onto B2 again once G2 lands before implementing, and reference `facility-cache.md` semantics in the spec rather than re-specifying them.
- Central's `blobReferences.js` has an empty `BLOB_REFERENCE_SOURCES` registry waiting for consumer tables — J2 registers the attachment hash column there (subject to the scoping question above).
