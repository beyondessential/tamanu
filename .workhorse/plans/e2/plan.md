# Content-addressed blob store primitive (E2) — plan

The core on-disk store and its interface. Consumers (attachments, assets), transfer,
and the facility outbox/cache live in sibling cards; this card is the foundation only.

Behaviour is already specified in the epic (B2) under `specs/blob-storage/`:

- **`overview.md` (BLOB)** — framing: attachments/assets as content-addressed blobs, bytes on disk, DB holds only the hash.
- **`content-addressing.md` (CAS)** — hashing, algorithm-tagged hashes, the `blake3/ab/cd/<rest>` fan-out layout, the blob-vs-reference model, and the local `blobs` registry.
- **`capacity.md` (CAP)** — the system free-disk floor (evict cache, then refuse) and the configurable store root.

No new spec area is needed. The notes below flag the few thin spots where CAS/CAP may want a
tightening criterion, and hold the implementation shape.

## Research spike: BLAKE3 vs SHA-256

The gating task; do this first because it can send us back to edit CAS.

- Confirm a **maintained BLAKE3 implementation for both Node and React Native**. The RN story is the risk.
- Benchmark it against **hardware-accelerated SHA-256** on representative hardware.
- This card is empowered to **fall back to SHA-256 with evidence** if the RN story or performance is inadequate. Because hashes are algorithm-tagged (`blake3:` / `sha256:`), either choice fits the layout and a future migration stays possible.
- If we fall back, update **CAS** — it currently asserts BLAKE3 as fact — before implementing.
- Per-range verified streaming (Bao) is out of scope here; it's a deferred option checked in this spike only if large-file range verification is later wanted (P2's concern).

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

- [ ] Research spike: BLAKE3 Node + RN availability and benchmark vs SHA-256; record the decision and evidence here
- [ ] If SHA-256 fallback: update CAS before proceeding
- [ ] `blobs` table migrations — server (Sequelize) + mobile (TypeORM), no sync, no changelog
- [ ] `BlobStore` class: `has` / `get` / `put` / `delete` with hash-on-write and atomic temp-write-then-rename
- [ ] Windows/NTFS rename and path handling, with coverage on the atomic-write path
- [ ] Configurable store root (config) + free-disk reserve (setting)
- [ ] Free-disk floor: measure volume free space, cache-eviction hook, refuse-new-blob path (central included)
- [ ] Consider tightening CAS with an atomic-write criterion and (optionally) the interface contract
- [ ] Unit tests: fan-out layout, empty blob, dedupe no-op, floor refusal, registry state
