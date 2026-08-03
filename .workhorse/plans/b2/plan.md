# Content-addressed blob storage — epic plan

This is the working document for the epic (card B2). The feature is decomposed
into the work items below; each is intended to become its own sub-card, specced
and built separately. This plan holds the shared design decisions, the grounding
in the current code, and the sequencing so the sub-cards start from a common base
rather than re-deriving it.

Specs for this feature land in a new `specs/blob-storage/` area, cross-referencing
`specs/sync/`. Attachments and assets remain documented in their own areas but
reference the blob-storage specs for how bytes are stored and moved.

## Motivation

Attachments are stored as `bytea` in Postgres. Two costs:

1. **Database bloat** — deployments carry ~400 GB of attachment data alongside
   ~200 GB of clinical data.
2. **Changelog duplication** — `logs.record_change` snapshots the whole row via
   `to_jsonb(NEW.*)` (`000_baseline.sql:756`), so every write-once attachment is
   copied a second time into `logs.changes`.

The fix: store blobs on the filesystem as content-addressed storage (SHA-256,
git-style), with the DB row holding only the hash. Built as a general blob-store
primitive; attachments and assets (the two `bytea` tables) become consumers.
Moving the bytes out of the row removes them from both the DB and the changelog.

## Architecture decisions (locked — inherited by all sub-cards)

- **Layout:** SHA-256, lowercase hex, two-level fan-out (`ab/cd/<rest>`). Driven
  by NTFS: 8.3 short-name insertion cost, case-insensitivity (hence hex, never
  base32/base64), reserved names/characters. Keep the store root shallow to stay
  under `MAX_PATH`.
- **Atomic writes:** temp-write then rename. Content addressing defuses the
  Windows rename-over-existing problem — if the target exists, the bytes are
  identical by definition, so discard the temp. Retry rename/delete on
  `EPERM`/`EBUSY` (AV locks); reuse the existing backoff shape
  (`attachment.js:40`).
- **Schema:** keep row `id` as a UUID; add a `hash` column. A local `blobs`
  metadata table holds hash → size, refcount, and cache/scrub/scan/FEC state.
  Store hashes algorithm-tagged (`sha256:…`) for future agility.
- **Transfer is decoupled from record sync direction.** The row syncs whichever
  way it already does, carrying only the hash; bytes are resolved separately by
  one symmetric fetch-by-hash primitive. The facility attachment GET
  (`facility-server/app/routes/apiv1/attachment.js:22-42`, try-local-then-central)
  is the reference implementation.
- **Facility = outbox + LRU cache**, not delete-after-push (replaces
  `deleteRedundantLocalCopies.js`). Hard invariant: **never evict a blob not yet
  durable on central** (outbox = the only copy). The cache/index is **local-only:
  no sync, no changelog trigger** — otherwise it reintroduces the churn we are
  removing. Eviction is per-hash (dedup), LRU + size budget.
- **Local hash = local id assignment = offline-tolerant async upload.** The
  facility computes the hash without central, writes the row + metadata
  immediately, enqueues bytes to the outbox, and a background pusher drains it.
- **Self-heal ladder** (cheapest-first): FEC → peer → backup → escalate.

## Grounding in the current code

- **Two blob tables:** `attachments` (`models/Attachment.ts`,
  `PUSH_TO_CENTRAL_THEN_DELETE`) and `assets` (`models/Asset.ts`,
  `PULL_FROM_CENTRAL`, bytes ride inside the sync record). Other `bytea` columns
  (`private_key`, `public_key`, `payload`) are crypto/keys, out of scope.
- **Two attachment ingest paths** to unify under the outbox: out-of-band POST to
  central (`uploadAttachment.js:30` → `central-server/app/attachment.js:52`), and
  direct `Attachment.create` + sync (patient letters
  `createPatientLetter.js:42`, survey photos `SurveyResponse.ts:497`, FHIR lab
  PDFs `FhirDiagnosticReport.ts:258`).
- **Consistency-window readers** (assume bytes are local, need fetch-on-miss):
  patient-letter logo `makePatientLetter.jsx:24,41`, asset serve route
  `asset.js:18`, profile picture `patientProfilePicture.js:59` (always proxies
  central — route through the cache). Central-side readers are safe (authoritative).
- **Mobile already separates file from row** (`mobile/App/models/Attachment.ts`
  `filePath` + `@AfterLoad`) — a working precedent, not a blocker.
- **Windows awareness already in tree:** `assertConsistentPathCasing.ts`
  (NTFS case-insensitivity), `tmpdir.js:7`, `getFreeDiskSpace.js:12`.
- **No AV/malware scanning exists today** — moving to files closes a current
  blind spot.
- **Hooks:** `ScheduledTask` framework (`packages/*/app/tasks/`), health route
  (`health.js`, existing `canUploadAttachment` probe), Canopy healthchecks
  bridging to runbooks (`docs/healthchecks.md`, existing `btrfs` check).

## Work items (candidate sub-cards)

Phased by dependency. Each unchecked item is a sub-card owed; ticked when its spec
and build land.

### Phase 1 — Foundation

- [ ] **Blob store primitive** — `BlobStore` interface (`has`/`get`/`put`/`delete`),
  CAS on-disk layout, atomic write+rename, the `blobs` metadata table, hash
  algorithm agility, store-root config (persistent, not `tmpdir`).
- [ ] **Blob transfer subprotocol** — symmetric fetch/put by hash, fetch-on-miss,
  content verification on receipt, resumable/chunked transfer for large files over
  poor links. Depends on: blob store primitive.
- [ ] **Facility cache & outbox** — outbox durability + background pusher, LRU/size
  eviction, refetch-on-demand, disk-full/backpressure, local cache index. Replaces
  `deleteRedundantLocalCopies`. Depends on: primitive, subprotocol.

### Phase 2 — Consumer migration

- [ ] **Attachments** — convert the table and every read/write path (upload,
  patient letters, survey photos, FHIR lab PDFs, profile pictures, web download);
  local id assignment; streaming + ETag/range on serve. Depends on: Phase 1.
- [ ] **Assets** — convert the table; add fetch-on-miss to asset readers
  (patient-letter logo, asset serve route, certificate rendering). Depends on:
  Phase 1.
- [ ] **Mobile** — align mobile's file-backed model to the subprotocol, lazy
  fetch, bounded eviction. Depends on: Phase 1.

### Phase 3 — Operational (highest risk)

- [ ] **Data migration & rollout** — backfill ~400 GB (batched/throttled), purge
  historical changelog blob copies, version skew across a rolling upgrade,
  dual-read behind a flag, rollback. Depends on: Phase 2.
- [ ] **Backups & restore** — dual-store consistency and ordering, restore
  procedure, incremental CAS backup, update the `facility-restored-from-backup`
  runbook.

### Phase 4 — Resilience (optional, off-by-default; can follow)

- [ ] **Integrity scrub** — content + referential checks, read-time verify,
  scheduled task, severity-by-tier response, self-heal, Canopy check + runbook,
  scrub-state in the index.
- [ ] **AV scanning** — active host-scanner invocation (clamd / Defender / ICAP),
  verdict cache by hash, quarantine-vs-heal as a first-class propagating state,
  serve policy for not-yet-scanned blobs.
- [ ] **Error correction (FEC)** — parity sidecar for redundancy-less substrates
  (NTFS bare metal), repair as the first rung of the heal ladder, correction-rate
  telemetry as a failing-media early warning.

### Cross-cutting

- [ ] **Security & access control** — authz stays at the reference layer (the blob
  endpoint is not an unauthenticated CDN); encryption at rest and its tension with
  dedup. May fold into Phase 1 rather than stand alone.

## Open risks to resolve during speccing

- **Version skew** during rollout — sync/transfer protocol compatibility across
  mixed-version servers.
- **Backups/restore** consistency between the DB and blob store.
- **Authz** on content-addressed access.
- **True/legal erasure** vs dedup and soft-delete-only clinical data.

## Sequencing notes

- Phase 1 is strictly foundational; nothing else can be specced concretely until
  the `BlobStore` interface and the `blobs` table shape are fixed.
- Attachments and Assets (Phase 2) can proceed in parallel once Phase 1 lands.
- Migration (Phase 3) is the gating operational risk and should be specced early
  even though it builds last, because version-skew constraints feed back into the
  Phase 1 subprotocol design.
- Phase 4 items share the scrub's detect-and-repair path and the local index;
  spec the index once (Phase 1) with room for their state columns.
