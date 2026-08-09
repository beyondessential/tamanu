# Route attachments through the blob store — plan

Implements `specs/blob-storage/attachments.md` (ATCH). Rewires the `attachments`
table and every attachment read/write path onto the blob-store foundation
(E2 `BlobStore`, F2 transfer channel, H2 `blobReferences`). New attachments store
bytes in the blob store keyed by hash; readers tolerate both hash-backed and
legacy in-database rows.

## Foundation available (E2/F2/H2, this branch)

- `BlobStore` at `packages/database/src/blobStore/BlobStore.ts` — `has`/`stat`/`get(hash,{start,end,stat})`/`put(source,{sizeHint})→{hash,size,existed}`/`delete`, plus staged transfer methods. Single pool, no tier column; `put` refuses with `InsufficientStorageError` at the free-disk floor.
- `ctx.blobStore` on both central (`ApplicationContext.js:95`) and facility (`:82`); reachable in handlers via `req.ctx.blobStore` (central) / facility equivalent.
- Central `blobReferences.js` — `registerBlobReferenceSource({ recordType, hashColumn })`, consumed by `isHashReferencedInScope`. Registry currently empty.
- Central `/api/blob` transfer routes; facility `BlobTransferChannel` (`open` = read-through fetch-on-miss). `BLOB_AVAILABILITY_STATES` in `packages/constants/src/blobs.ts`.
- Hash helpers in `packages/utils/src/blobs.ts`; `formatBlobHash`/`parseBlobHash`.

## G2 (merged)

Rebased onto `workhorse/b2`, which now carries G2. Available: `blobStore.put(source,
{ tier })` with `BLOB_TIERS.OUTBOX`/`CACHE`, `FacilityBlobCache.putOutbox` (call it
inside the operation that creates the referencing record — facility servers run no
orphan collection), `blobCache.open()` for read-through with recency touch,
`BlobOutboxPusher` on a scheduled task, and `blobReferenceResolvers` for push
eligibility (J2 registers the attachments resolver).

**Bug found in G2's wiring, still to fix:** `setupSyncRuntime.js` constructs
`BlobTransferChannel` without `facilityIds`, so it defaults to `[]` and central's
`requestFacilityScope` rejects every fetch and push with a 403. G2's own tests pass
`facilityIds` explicitly, which is why they don't catch it. Fix is to pass
`getServerFacilityIds()`.

## Progress note

Phase A (central ingress + serving) and most of Phase B (scoping, sync direction,
scope-at-creation, FHIR lab PDFs) are **implemented and verified** locally:
central attachment 15/15, attachment sync scope 4/4, DiagnosticReport 15/15, the
full central sync suite 172/172, facility blob/document/survey suites 131/131,
BlobStore 43/43, eslint clean, migrations applied against a real Postgres, dbt
regenerated with `dbt-check-todos` passing. What remains is the facility-origin
write path (§5 below).

**Local environment note:** the repo needs Node 26.3.1 (`fnm use`), and a stale
`DATABASE_URL` env var pointing at a dead port overrides the config and breaks
every DB-backed test — run with `env -u DATABASE_URL`.

## Phase A — central ingress + serving (additive, reversible)

### 1a. Schema — hash column
- [x] Server migration `1785820000000-addAttachmentHash.ts`: add `hash` (TEXT, nullable), relax `data` to nullable. DDL only. Applied against a real Postgres.
- [x] `Attachment` model: add `hash` column.

### 3a. Serving — shared helper + central reads
- [x] Extract range/etag/streaming framing from `blobTransfer.js` into `app/utils/serveBlob.js`; refactor the transfer route onto it.
- [x] Central `GET /api/attachment/:id`: hash → `serveBlob`; legacy → in-database bytea; retain `base64=true`.

### 4a. Write paths — central ingress
- [x] Central `POST /api/attachment`: admit to `ctx.blobStore`, store hash, size from admitted bytes; drop `canUploadAttachment` in favour of the store's free-disk floor.
- [ ] FHIR lab PDF: `FhirDiagnosticReport.saveAttachment` admits to the store — deferred (needs the blob store plumbed to the model method, not just the route).
- [x] Regenerate dbt source models for the `hash` column; `dbt-check-todos` passing.
- [x] Central endpoint tests: store-backed upload, admitted size, streamed serve with etag, range, unsatisfiable range, base64, legacy fallback, insufficient storage.

## Phase B — scoping and sync (done), facility-origin writes (remaining)

### 1. Schema — scoping + persistent sync  [done]
- [x] `patient_id` / `encounter_id` on attachments (DDL), backfilled from owning records (separate DML), `flag_lookup_model_to_rebuild('attachments')`.
- [x] `syncDirection` → BIDIRECTIONAL; `buildPatientSyncFilter` + `buildSyncLookupQueryDetails` mirroring DocumentMetadata (COALESCE patient, encounter-linked joins).
- [x] Legacy rows excluded from sync via a filtering join, so their bytes never reach a facility. The filter is a join, not a where clause, because a full lookup rebuild replaces the where clause — covered by a test that rebuilds.
- [x] dbt regenerated for hash + scope columns; `dbt-check-todos` passing.
- [ ] Mobile TypeORM migration + model mirror; decide mobile pull direction (L2 territory).

### 2. Scope at creation  [done]
- [x] Central `POST /attachment` accepts and persists `patientId`/`encounterId`.
- [x] `uploadAttachment` threads scope; patient documents pass `patientId`, encounter documents pass `encounterId` + the encounter's patient.
- [x] Patient letters, survey photo answers (create and patch), and FHIR lab PDFs all set scope at creation.

### 3. blobReferences registration  [done]
- [x] Central: `attachments`/`hash` registered as a blob reference source (access control).
- [x] Facility: attachments resolver registered in `blobReferenceResolvers` so outbox blobs become push-eligible.

### 4. FHIR lab PDFs  [done]
- [x] `FhirDiagnosticReport.saveAttachment` admits to the central store via `sequelize.blobStore`, scoped to the lab request's encounter.

### 5. Facility-origin writes — remaining
- [ ] Fix the G2 `facilityIds` wiring bug first; the facility push path 403s without it.
- [ ] `uploadAttachment.js`: admit to the facility store at outbox tier and create the attachment row in the same operation, replacing the synchronous base64 POST-to-central (spec: creation completes without central connectivity).
- [ ] `createPatientLetter.js`: admit the generated PDF to the facility outbox.
- [ ] Enforce `maxFileSize` at admission; surface `InsufficientStorageError`.
- [ ] Facility `GET /api/attachment/:id`: read-through `blobCache.open()` (fetch-on-miss, recency touch) → `serveBlob`; content-pending response distinguishing upload- from fetch-pending. Note `req` has no blob store today — needs plumbing through `createApiApp`, and the API process does not run `setupSyncRuntime`, so reads there are local-only.

### 6. Tests
- [ ] Continue working `.workhorse/test-cases/j2/overview.md`. 11/46 ticked.

## Open product questions (surface, don't guess)
- Central ingest of legacy inline sync rows — only needed if mobile L2 ships in a
  later release than J2. Confirm release coupling with the team.
- Awaiting-content interim copy, and whether download is disabled or retryable —
  product call.
