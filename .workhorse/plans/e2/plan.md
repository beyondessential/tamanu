# Content-addressed blob store primitive (E2) — plan

The core on-disk store and its interface. Consumers (attachments, assets), transfer,
and the facility outbox/cache live in sibling cards; this card is the foundation only.

Behaviour is already specified in the epic (B2) under `specs/blob-storage/`:

- **`overview.md` (BLOB)** — framing: attachments/assets as content-addressed blobs, bytes on disk, DB holds only the hash.
- **`content-addressing.md` (CAS)** — hashing, algorithm-tagged hashes, the `blake3/ab/cd/<rest>` fan-out layout, the blob-vs-reference model, and the local `blobs` registry.
- **`capacity.md` (CAP)** — the system free-disk floor (evict cache, then refuse) and the configurable store root.

No new spec area is needed. The notes below flag the few thin spots where CAS/CAP may want a
tightening criterion, and hold the implementation shape.

## Research spike: BLAKE3 vs SHA-256 — decided: SHA-256

The gating task is resolved. **Hashing is SHA-256.** CAS has been updated to match (algorithm bullet, `sha256:` tag, `sha256/ab/cd/<rest>` path). The decision was performance, not availability.

- **Availability was not the deciding factor.** Two maintained new-architecture RN Android BLAKE3 modules exist, both vendoring the official BLAKE3 C code with the ARM64 NEON path — so "no RN story" did not hold.
- **Performance on ARM decided it.** BLAKE3's win is an x86-AVX2 phenomenon. On ARM, hardware SHA-256 beats BLAKE3 by ~1.3x, and every mobile device is ARM. 128 MB single-threaded: Apple M5 SHA-256 3365 vs BLAKE3 2598 MiB/s; linux arm64 3345 vs 2498; only linux x64 EPYC reversed it (1514 vs 3550). The x86-server BLAKE3 win is real but unreachable — a 10 MB hash costs 6.6 ms vs 2.5 ms, both far above the disk/network throughput that actually bounds a put.
- **Mobile hashing must be a native module that streams from a file path.** WASM is unavailable in React Native — Hermes exposes no WebAssembly global and the Hermes lead has said it won't be added — which rules out any WASM hasher on mobile. Pure-JS on Hermes measured 3.2 MiB/s (~35x slower than V8); a 10 MB attachment would block JS for ~3 s. So the mobile `put` path hashes via a native SHA-256 module reading from the temp file, not in JS.
- **Avoid the `blake3` npm package regardless.** Its `latest` (3.0.0) pins an unpublished `blake3-wasm`, so install fails with ETARGET; the last installable pin silently fell back to WASM at a third of native speed while exiting 0. Noted so it stays out of the tree if BLAKE3 is ever revisited.
- **Outstanding verification (do first in E2):** no Android build was attempted and no on-device Android number was measured — the Android throughput figures are the module vendor's own. Confirm the chosen native SHA-256 module builds against RN 0.85.3 and streams from a file path on a real ARM device before building the mobile `put`.
- Per-range verified streaming (Bao) is out of scope here; it was a BLAKE3-only option and does not apply.

Full write-up lives in a private scratch repo the spike used for an x86 CI runner (`dannash100/blake3-sha256-spike`, `DECISION.md`), not tracked here.

## BlobStore interface

`has` / `get` / `put` / `delete`. CAS describes storage and identity but not the interface contract itself — decide whether to fold a short contract into CAS or leave it as implementation detail.

- **`put`** — hash while streaming to a temp file, then place at the fan-out path. Idempotent: if the hash is already present, it's a no-op (content-addressed dedupe within an algorithm). Registers the blob (size, integrity state) in `blobs`.
- **`get`** — stream bytes by hash from the fan-out path.
- **`has`** — presence check (registry and/or file stat).
- **`delete`** — remove the file and its registry row. (Reclamation policy is `reclamation.md`; this is the mechanism.)

## Atomic writes & filesystem handling

Load-bearing durability detail, currently absent from CAS — worth **one CAS criterion** so a reimplementation is held to it.

- Temp-write-then-rename: write to a temp file within the store, flush, then atomically rename into the two-level fan-out path. A reader never sees a partial blob.
- **Windows/NTFS**: rename-over-existing semantics and `EPERM`/sharing-violation handling, path-length limits. Lowercase-hex path components (already in CAS) cover the case-insensitivity concern.

## Store root, free-disk floor, config vs settings

- **Store root path** → `config/*.json5` (a bootstrap filesystem path, deployment-specific, may sit on a separate volume — same class as crypto key paths, read before settings exist).
- **Free-disk reserve** → a **setting** (operator-tunable threshold, DB-backed, admin-editable). See `llm/project-rules/settings.md`.
- Floor behaviour (CAP): keep host free space above the reserve measured against *actual* volume free space; as it approaches, evict cache first (the eviction hook — the LRU cache itself is G2), then refuse new blobs rather than cross the reserve. Applies on central too.

## The `blobs` registry

- Single local table: hash, size, integrity state.
- **Never synced, never in the change log.** Set the model's sync direction accordingly and keep it out of changelog capture.
- Authoritative content record on central; cache/state index on facility and mobile.
- Migrations in lockstep: **Sequelize (server)** and **TypeORM (mobile)** written together.

## Build checklist

- [x] Research spike: BLAKE3 Node + RN availability and benchmark vs SHA-256; decision recorded above — SHA-256
- [x] SHA-256 fallback taken: CAS updated (algorithm bullet, `sha256:` tag, path example)
- [ ] Verify a native SHA-256 module builds against RN 0.85.3 and streams from a file path on a real ARM device (spike left this unmeasured) — do before the mobile `put`
- [x] Blob constants (`@tamanu/constants`): hash algorithms, current algorithm, integrity states
- [x] Pure hash/path helpers (`@tamanu/utils/blobs`): tagged-hash format/parse, fan-out path segments — dependency-free so mobile can reuse them later
- [x] `blobs` table migrations — server (Sequelize) + mobile (TypeORM), no sync, no changelog
- [x] `Blob` model (server) + `Blob` entity (mobile), registered in model maps
- [x] Exclude `public.blobs` from sync and changelog capture (`migrations/constants.ts`)
- [x] dbt source model for `blobs` (hand-written; reconcile with `npm run dbt-generate-model` when a live DB is available)
- [x] `BlobStore` class (`@tamanu/database/blobStore`): `has` / `get` / `put` / `delete` with hash-on-write and atomic temp-write-then-rename
- [x] Windows/NTFS rename and path handling (retry on EEXIST/EPERM/EBUSY, dedupe on lost race); real-NTFS verification tracked in test cases
- [x] Configurable store root (`TAMANU_BLOB_STORAGE_ROOT` env var, default `data/blobs` — a per-host volume path, so not a synced setting and not config) + free-disk reserve (global setting `blobStorage.freeDiskReserveGB`)
- [x] Free-disk floor: measure volume free space (`fs.statfs`), cache-eviction hook, refuse-new-blob path (central included)
- [x] Tighten CAS with the atomic-write criterion and the store interface contract
- [x] Unit tests: fan-out layout, empty blob, dedupe no-op, floor refusal, registry state (see `.workhorse/test-cases/e2/overview.md`)

Follow-ups for sibling cards:

- Crash-orphaned files under `<root>/tmp` are not swept by the primitive; reclamation (D2's
  area) should own a startup/scheduled sweep of stale temp files.
- Server context wiring (constructing `BlobStore` from `blobStorageRoot()` and the
  `blobStorage.freeDiskReserveGB` setting) lands with the first consumer (F2), as does the
  eviction hook implementation (G2).

Implementation notes:

- `BlobStore` lives in `packages/database` because it owns the registry writes and shared/
  must not import database models. It takes the store root, the `Blob` model, a reserve
  getter (thread the settings value in; the store doesn't read settings itself), and an
  optional `evictCache(bytesNeeded)` hook that G2's LRU cache will supply.
- File placement happens before registry insert: a crash between the two leaves an orphan
  file that a later `put` of the same content adopts, never a registry row pointing at
  missing bytes.
- Node >= 26 has `fs.promises.statfs`, so no `check-disk-space` dependency is needed
  (central-server's existing `getFreeDiskSpace` predates it).
- Server wiring (constructing the store in each server's application context) is left to
  the consumer cards (F2/G2) — this card ships the primitive, the config key, and the
  setting.
