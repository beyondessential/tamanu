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

- [ ] **What exactly is "local hash-based id assignment"?** If the attachment id is derived from the content hash, two uploads of identical bytes collide into one attachment row — but CAS says references stay distinct (many references → one blob) and carry their own content-type/title. Also: id format must satisfy the existing `[A-Za-z0-9-]+` id constraint. **Lean:** local assignment is the load-bearing part (no central round-trip), hash-derivation is not — under the outbox model the row is created locally in one transaction and both record sync and byte transfer are already idempotent, so the duplicate-on-retry failure mode that motivates deterministic ids disappears. A plain locally-generated UUID plus the `hash` column serves offline tolerance, keeps references distinct per CAS, and avoids the collision with per-owner scoping below.
- [ ] **Attachment sync lifecycle.** Today attachments are `PUSH_TO_CENTRAL_THEN_DELETE` (facility deletes after push; mobile oddly syncs them). **Lean:** attachments become normally-synced persistent records. XFER's premise is that records sync carrying only the hash, and BLAC's sync-first push requires central to hold the synced reference before accepting bytes; the bloat rationale for delete-after-push disappears once rows are hash-only. Remaining decision is scope: unscoped bidirectional sync sends every attachment row to every facility and mobile device (initial-sync volume) — see next question.
- [ ] **Scoping gap for access control.** The attachments table has no patient or facility columns, so its sync_lookup entries would have null patient_id/facility_id — which passes BLAC's scope check for *every* facility, including sensitive-facility content. BLAC covers the policy (scope = sync scope, sensitive facilities included) but not the mechanism for attachments. **Lean:** add patient/facility scoping columns to attachments, denormalised from the owning record at creation. One move gives BLAC-conformant scoping, patient-scoped sync (fixing the mobile volume concern above), and a single clean registration in `blobReferences.js`. Requires per-owner attachment rows, which is the other reason to drop hash-derived ids: a deduped global row cannot carry two patients' scoping.
- [ ] **Central ingest of legacy inline rows.** Mostly answered by the epic's version-skew stance (M2: feature lands on a breaking release, sync rejects version skew) — if mobile's L2 ships in the same release, no new inline-bytea rows arrive post-upgrade, "legacy" means at-rest data only, and J2's readers just tolerate it until M2 backfills. **To confirm with the team:** does L2 land in the same release as J2? If not, central needs a transitional writer admitting inline bytes on arrival.
- [ ] **Does `base64=true` survive?** Profile pictures and mobile's photo viewer rely on base64 JSON responses today. **Lean:** keep it — it is an attachment-endpoint compatibility concern, not a blob-layer one. Endpoint streams with range support by default per SERVE; base64 retained where callers need it. Migrating those callers is out of scope.
- [ ] **Upload guards.** The disk half is covered: CAP specifies admission refusal at the free-disk reserve, replacing `canUploadAttachment`. **Lean:** keep `maxFileSize` as the attachment-domain product guard, enforced at admission on the facility. Only the user-facing rejection copy is J2's to spec.
- [ ] **Awaiting-content copy.** Backend fully covered by XFER (response distinguishes upload-pending from fetch-pending; file presents as existing-but-awaiting-bytes). Only the single interim message and whether download is disabled or retryable remain — product call at spec review.

## Trade-offs

- **Hash-derived ids vs per-owner scoping.** The card description names both "local hash-based id assignment" and (implicitly, via BLAC) scoped access control, but they pull apart: deterministic hash ids dedupe reference rows network-wide, while scoping needs each owner's attachment row to carry that owner's patient/facility. Recommendation is to keep dedupe at the blob layer only (where CAS already provides it — many references, one stored blob) and let reference rows be distinct, locally-identified, and scoped.

## Implementation notes

- Facility upload order-of-operations must satisfy CACHE's invariant that outbox content always has a local referencing record: admit to the store (outbox tier) and create the attachment row together, so an abandoned upload can't strand an unevictable blob.
- G2 (facility outbox/LRU cache) will merge into B2 soon; J2's facility-side write path lands on its `BlobStore` tier API. Rebase onto B2 again once G2 lands before implementing, and reference `facility-cache.md` semantics in the spec rather than re-specifying them.
- Central's `blobReferences.js` has an empty `BLOB_REFERENCE_SOURCES` registry waiting for consumer tables — J2 registers the attachment hash column there (subject to the scoping question above).
