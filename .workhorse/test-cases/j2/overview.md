# Route attachments through the blob store — test cases

Scenarios verifying that new attachments are written to the blob store and served
from it, across every write path (web document uploads, patient letters, survey
photos, FHIR lab PDFs, profile pictures) and every read path (web download and
previews, facility read-through, mobile fetch), while readers still tolerate
legacy in-database rows. Automated coverage is expected in the central endpoint
tests (`packages/central-server/__tests__/`), facility route tests
(`packages/facility-server/__tests__/`), and model/migration unit tests; UI and
cross-server flows are manual. Scenarios cite the criterion they exercise;
uncited ones are operational.

## Migration and model

- [ ] The migration adds `hash`, and patient/facility scoping columns, to `attachments` and relaxes `data` to nullable, with a mobile (TypeORM) migration alongside and the dbt source models regenerated
- [ ] A newly created attachment row carries a locally assigned identifier, a hash, a content-type, and a size, with no `data` bytes (verifies spec: ATCH)
- [ ] Creating an attachment assigns its identifier without reaching another server (verifies spec: ATCH)
- [ ] A legacy row (bytea populated, hash null) is untouched by the migration and remains readable (verifies spec: ATCH)
- [ ] An attachment record syncs as an ordinary persistent record carrying only its hash — the sync payload and the changelog snapshot contain no blob bytes (verifies spec: ATCH)
- [ ] A facility retains its attachment records after they reach central, rather than deleting them post-push (verifies spec: ATCH)

## Scoping and sync scope

- [ ] A new attachment copies the patient and facility linkage of the record it is created for at creation time (verifies spec: ATCH)
- [ ] An attachment for a record pinned to a facility syncs only to facilities entitled to that record's scope, and its blob is authorised against that scope (verifies spec: ATCH, BLAC)
- [ ] An attachment on a sensitive facility's record is not served to a facility barred from that facility's data (verifies spec: BLAC)

## Upload paths

- [ ] Upload a document against an encounter (`POST /api/encounter/:id/documentMetadata`) and confirm the bytes are admitted to the facility outbox store, the row records hash/size/type, and the document metadata links to it (verifies spec: ATCH)
- [ ] Upload a document against a patient (`POST /api/patient/:id/documentMetadata`) with the same outcome (verifies spec: ATCH)
- [ ] Upload a document while central is unreachable and confirm creation completes locally, then the record syncs and the background pusher delivers the bytes after connectivity returns (verifies spec: ATCH, XFER)
- [ ] Confirm an attachment's recorded size is taken from the bytes actually admitted, not from the caller's declared size (verifies spec: ATCH)
- [ ] Upload the same file content twice and confirm both attachment references resolve, each with its own scoping, backed by a single blob on disk (verifies spec: CAS)
- [ ] Create a patient letter (`POST /api/patient/:id/createPatientLetter`) and confirm the generated PDF is admitted to the facility outbox and the row carries its hash (verifies spec: ATCH)
- [ ] Submit a survey response with a photo answer from web and confirm a hash-backed attachment is created with the answer body holding its id (verifies spec: ATCH)
- [ ] Blank out a photo answer (`PUT /api/surveyResponseAnswer/photo/:id`) and confirm the empty-content overwrite stores the defined zero-byte hash and the photo no longer renders (verifies spec: CAS)
- [ ] Post a FHIR DiagnosticReport with a `presentedForm` PDF and confirm the attachment is admitted directly to the central store hash-backed and linked to the lab request (verifies spec: ATCH)
- [ ] Confirm central accepts a hash-carrying attachment record arriving through sync from a facility, with the bytes arriving separately over the transfer channel (verifies spec: ATCH, XFER)
- [ ] Upload a document over the configured maximum file size and confirm it is rejected with the request stream drained, so the response finish logs without error (verifies spec: ATCH)
- [ ] Attempt an upload the store cannot admit without crossing the free-disk reserve and confirm an insufficient-storage error (verifies spec: ATCH, CAP)

## Serving

- [ ] Fetch an attachment (`GET /api/attachment/:id`) and confirm the bytes stream with the declared content-type, without the file being buffered whole in memory (verifies spec: ATCH, SERVE)
- [ ] Request a byte range of a large attachment and confirm a partial response with correct extent (verifies spec: SERVE)
- [ ] Confirm content served from the store carries the hash as cache validator and a conditional re-request returns not-modified (verifies spec: SERVE)
- [ ] Request an attachment with `base64=true` and confirm the inline-encoded response still works for a hash-backed attachment (verifies spec: ATCH)
- [ ] Fetch a legacy row (bytea, no hash) and confirm it serves identically, resolving the in-database bytes because no hash is present (verifies spec: ATCH)
- [ ] Serve a legacy attachment on a facility and confirm it reads through the central server, since legacy rows reside only on central (verifies spec: ATCH)
- [ ] Fetch an attachment on a facility that holds the blob locally and confirm it serves without contacting central (verifies spec: ATCH)
- [ ] Fetch an attachment on a facility that does not hold the blob and confirm the read-through resolves it from central, caches it, and serves it (verifies spec: ATCH, XFER, CACHE)
- [ ] Confirm an unauthenticated request for attachment content is refused, and an authenticated one is checked against permission to read the attachment (verifies spec: ATCH, BLAC)
- [ ] Download, print, and preview a hash-backed document from the web document table (PDF and image) and confirm each renders
- [ ] Open a lab request's attached PDF from the lab attachment modal and confirm it renders for a hash-backed attachment
- [ ] Render a patient profile picture (survey `ProfilePhoto` answer, `base64=true`) for a hash-backed attachment, including on the printed patient details (verifies spec: ATCH)
- [ ] View a survey photo answer on mobile for an attachment held only on central and confirm it fetches and displays

## Content-pending

- [ ] Fetch an attachment whose record has synced but whose bytes cannot be promptly resolved and confirm it presents as an existing file awaiting content, not not-found (verifies spec: ATCH)
- [ ] Confirm the awaiting-content response distinguishes upload-pending from fetch-pending, while the UI shows a single awaiting-content message for both (verifies spec: ATCH, XFER)
- [ ] Re-fetch a content-pending attachment after its bytes arrive and confirm it resolves to the content (verifies spec: ATCH, XFER)
- [ ] Confirm an attachment record is visible in lists while its bytes are still pending — the record is never held back for its blob (verifies spec: XFER)

## Lifecycle

- [ ] Create a patient letter on a facility, let the record sync and the blob push, and confirm central serves the PDF and the facility's outbox copy demotes to evictable cache (verifies spec: XFER, CACHE)
- [ ] Confirm an admitted blob always has its referencing attachment record, created in the same step, so no blob is left in the outbox unreferenced (verifies spec: ATCH, CACHE)

## Manual / operational

- [ ] Upload a large (hundreds of MB) document at a real facility and confirm bounded server memory during upload and download
- [ ] Upgrade a deployment with existing in-database attachments and confirm old documents still download and preview before any backfill runs
- [ ] Create an attachment post-upgrade and confirm the changelog rows for it carry the hash, not the bytes
- [ ] Pull the facility's network mid-upload and confirm the eventual state is consistent: the document exists with its bytes reaching central once connectivity returns, with no orphaned reference
