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

## Known dependency gap

- **G2 (facility outbox + background pusher) is not implemented.** `pushToCentral`
  is a one-shot primitive; there is no outbox table, no scheduler, and the facility
  context does not instantiate `BlobTransferChannel`. The fully offline-tolerant
  facility upload path (admit locally, push in background) depends on it. Interim:
  trigger `pushToCentral` consumer-side after admission; flag the durable-outbox
  scheduling as owed to G2. Revisit once G2 merges (working-doc note).

## Progress note

Phase A below (central-ingress + serving, additive, no sync-direction change) is
**implemented and verified**: central attachment suite 15/15, F2 blob transfer
34/34 (covering the `serveBlob` refactor), BlobStore 43/43, facility
uploadAttachment 3/3, eslint clean, migration applied against a real Postgres,
dbt models regenerated and `dbt-check-todos` passing. Phase B (sync direction +
scoping + facility-origin paths) is gated on two decisions (see bottom) and the
G2 dependency.

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

## Phase B — sync direction, scoping, facility-origin (gated)

### 1. Schema — scoping + persistent sync
- [ ] Add scoping columns (`patient_id`, optional `encounter_id`/`facility_id`); backfill from owning records (separate DML migration); `flag_lookup_model_to_rebuild('attachments')`.
- [ ] `Attachment` model: `syncDirection` → BIDIRECTIONAL; implement `buildPatientSyncFilter` + `buildSyncLookupQueryDetails` (patient-scoped).
- [ ] Mobile TypeORM migration + model mirror; decide mobile pull direction.
- [ ] Regenerate dbt source models; fill TODOs; `dbt-check-todos`.

### 2. blobReferences registration
- [ ] Register `{ recordType: 'attachments', hashColumn: 'hash' }` at central startup.

### 3. Facility serving via transfer channel
- [ ] Facility `GET /api/attachment/:id`: hash → read-through `open` (fetch-on-miss) → `serveBlob`; content-pending response distinguishing upload- vs fetch-pending.

### 4. Server-side survey answers
- [ ] `SurveyResponse.getBodyForAnswer` and photo blank-out (`surveyResponseAnswer` PUT): admit / zero-byte admit to the store.

### 5. Write paths — facility (admit local + push)
- [ ] `uploadAttachment.js`: admit to facility `blobStore` and create the attachment row together (CACHE invariant: outbox blob always has a referencing record); replace the synchronous base64 POST-to-central.
- [ ] `createPatientLetter.js`: admit generated PDF to facility store.
- [ ] Trigger `pushToCentral` for admitted blobs (interim, pending G2 scheduler).
- [ ] Enforce `maxFileSize` product guard at admission; map `InsufficientStorageError` to the user-facing insufficient-storage rejection.

### 6. Tests
- [ ] Work the `.workhorse/test-cases/j2/overview.md` checklist: migration/model unit, central endpoint (serve, legacy, content-pending, scope), facility route (read-through, base64), write-path integration. Tick as covered.

## Open product questions (surface, don't guess)
- Central ingest of legacy inline sync rows — only needed if mobile L2 ships in a
  later release than J2. Confirm release coupling with the team.
- Awaiting-content interim copy, and whether download is disabled or retryable —
  product call.
