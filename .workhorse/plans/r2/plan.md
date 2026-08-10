# Optional error correction for blob storage · R2

Parity sidecars over durable blobs, so a server on redundancy-less storage repairs
limited corruption in place before falling through to peer or backup. Spec is
`specs/blob-storage/error-correction.md` (FEC).

## Where this plugs in

Everything R2 extends is already merged on the epic branch:

- `packages/database/src/blobStore/BlobStore.ts` — `#admit` (parity write), `verify`,
  `delete`, `#placeAtFinalPath` (the atomic placement a repair reuses), `storedHashes`
  (the store walk that must not read parity as content).
- `packages/database/src/blobStore/BlobScrubber.ts` — `#verificationPass` is where a
  fault is detected and handed to `#heal`; the parity backfill rides the same pass.
- `packages/central-server/app/blobIntegrity/CentralBlobHealer.js` and
  `packages/facility-server/app/blobIntegrity/FacilityBlobHealer.js` — both currently
  quarantine on `BLOB_FAULTS.CORRUPT`. Correction is a rung ahead of that.
- `packages/settings/src/schema/{central,facility}.ts` — `blobStorage` subtree already
  exists on both, which is where the per-server enable and parity proportion belong.
- `docs/runbooks/blob-integrity.md`, `docs/reference/query-cookbook.md` — the
  correction-rate signal gets its own check and runbook alongside `blob_integrity`.

## Sequencing against S2

S2 (sans-io `packages/blobs`) rewrites `BlobStore.ts` and both transfer paths, which
is exactly the surface parity hooks into. Build R2 after S2 lands, or accept a rebase
through it. The spike should answer whether the parity codec can live in the sans-io
package at all: if the library needs native bindings or Node streams it cannot, and
parity stays server-side with mobile explicitly uncovered (which the spec already
says on other grounds).

Q2 (antivirus) only overlaps on the quarantine state, so it can land either side.

## Decisions taken

Recorded here so they are not relitigated. Each is now written into the spec.

- **Coverage is per server, over durable copies only.** Central covers every blob;
  a facility covers outbox blobs. Cache copies refetch, so parity over them spends
  disk the cache budget needs. Mobile is uncovered.
- **Retrofit through the scrub.** Parity is written at admission, and the scrub
  generates it for any covered blob that lacks it. Without this, enabling on an
  existing NTFS site protects nothing already stored, which is the actual use case.
- **Repair is in place, through the admission path.** Reconstruct to a temp file,
  verify the reconstruction against the blob's hash, then place it atomically. Keeps
  the immutable temp-write-then-rename invariant and avoids rewriting a file that may
  be open on Windows. Note `put()` refuses to replace existing bytes by design
  (`existed: true` wins, quarantined bytes included), so repair needs its own
  placement call rather than a `put`.
- **A failed parity write does not fail the admission.** The blob is stored
  unprotected and the scrub picks it up. Failing an upload because a protection
  sidecar could not be written is worse than storing unprotected content. Capacity is
  handled separately: `#ensureFloor` accounts for the parity a blob will carry.
- **Correction rate is its own health signal**, not an extension of `blob_integrity`.
  The operator action differs: replace the media, rather than recover the content.
- **Parity is derived, never a fault.** Damaged or missing parity over a blob that
  verifies is regenerated. Store captures exclude it; a restored server regenerates it
  through the scrub. Parity dies with its blob on delete and on outbox demotion.

## Deferred: parity over facility cache copies

Build without it. Cache copies are uncovered, as the spec says.

The argument for covering them is clinical rather than technical: a facility offline
for a long stretch, holding a corrupt cache copy, cannot show a clinician that
attachment until it can refetch, and parity would repair it locally. The argument
against is that it roughly doubles the covered population on a facility and competes
with the cache budget for exactly the content that is cheapest to replace. Genuinely
close, and not resolvable from first principles, so it is deferred rather than argued
further.

Revisit if a deployment reports attachments unavailable at a facility through a long
disconnection, or if the spike's overhead numbers come in low enough that the disk cost
stops mattering. Coverage is a predicate over the blob's tier, so widening it later is
a one-line change plus a retrofit pass the scrub already performs — not a redesign.

## Spike: parity codec (gate)

Blocked the build. Same shape as E2's BLAKE3 spike. Findings below.

- [x] Confirm a maintained Reed-Solomon (or par2) implementation usable from Node on
      Windows and Linux, with no unmaintained native build step
- [x] Benchmark encode throughput against BLAKE3/SHA-256 hashing on the same bytes,
      since parity rides the admission path
- [x] Establish the parameter shape: shard count and shard size versus the
      operator-facing proportion the spec specifies, and how a proportion maps onto it
- [x] Measure real overhead and sidecar size at a representative blob size mix
- [x] Confirm streaming encode is possible, or record the memory ceiling if the
      library needs the whole blob resident
- [x] Verify reconstruction actually works against seeded corruption, including
      corruption that exceeds the parity budget (must fail cleanly, not silently
      produce wrong bytes that then fail the hash check)
- [x] Report whether the codec can live in the sans-io `packages/blobs` boundary S2
      is drawing

## Spike findings

**Recommendation: write the codec ourselves, as ~150 lines of dependency-free JS in
`packages/blobs`.** Systematic Reed-Solomon over GF(256) with a Cauchy parity matrix and
256-entry multiply tables. There is no maintained in-process Reed-Solomon library for
Node, and the one recent candidate is broken on the decode path. par2 as an external
binary works and is maintained, but is 5x slower than our own encode, needs a
per-platform binary shipped like the antivirus scanner, and imposes its own sidecar
layout.

Measured on Apple M-series arm64, Node 26.3.1 (matching `.node-version`). Facility
bare metal will be slower in absolute terms; the ratio against hashing is the number
that transfers, and both sides have CPU acceleration (SHA-NI, ARM crypto extensions).

### 1. Codec survey

`CURRENT_BLOB_HASH_ALGORITHM` on this branch is SHA-256, so all comparisons are against
`node:crypto` SHA-256.

| Candidate | State | Verdict |
| --- | --- | --- |
| `@ronomon/reed-solomon` 6.0.0 | native addon, last published 2019 | Out. Unmaintained native build step on Windows is exactly what the card rules out. |
| `@digitaldefiance/reed-solomon-erasure.wasm` 1.0.2 (Feb 2026) | WASM, no deps, 3 publishes, ~23 downloads/week | Out. Decode is unreliable (below). Wraps darrenldl's `reed-solomon-erasure` Rust crate, itself last released 2019. |
| `wasm-reed-solomon-erasure`, `@subspace/reed-solomon-erasure.wasm`, `reed-solomon-erasure` | 2019 to 2022, same lineage | Out, abandoned. |
| `@digitaldefiance/node-rs-accelerate` 0.1.3 | `os: ["darwin"], cpu: ["arm64"]` | Out, Apple Silicon only. |
| par2cmdline-turbo 1.4.0 (Feb 2026) | maintained, prebuilt win-x64 / win-arm64 / linux binaries per release | Viable fallback, priced below. |
| own GF(256) codec | ours | Recommended. |

The WASM package fails a plain repeat-call test: the same reconstruct with one shard
missing returns OK on the first call in a process and `TOO_FEW_SHARDS_PRESENT` on every
call after it, and marking any parity shard missing fails even when all data shards are
intact. Reproduced through the package's own wrapper and through a thin binding written
directly onto its wasm exports, so the fault is in the wasm artefact rather than the JS
layer. Its ESM entry point also throws on import (`__dirname is not defined`), which
matters in this monorepo. Encode was fine and fast (1683 MB/s at 16+2), so the ceiling
a maintained WASM codec would reach is roughly 3x ours, if one appears.

### 2. Throughput

SHA-256: **2965 MB/s** at 64 KiB, **3283 MB/s** at 1 MiB, **3342 MB/s** at 8 MiB.

Own codec, encode: **796 MB/s** at 16+2, **600 MB/s** at 32+3, 302 MB/s at 32+6,
139 MB/s at 128+13. Decode of 3 missing shards at 32+3: **538 MB/s**.

Encode cost is `parityShards × blobSize` table lookups and is independent of the data
shard count, so throughput follows `≈1800 / parityShards` MB/s across every
configuration measured. Per MiB that is 0.30 ms to hash and 1.67 ms to encode 3 parity
shards, so a 1 MiB attachment gains ~1.7 ms and a 32 MiB imaging export ~53 ms on top
of a ~10% larger disk write. **Parity can be written inline at admission**; it does not
have to be deferred to the scrub. Retrofitting 100 GB through the scrub costs about 3
minutes of CPU, well inside a rate-limited pass.

### 3. Parameter shape

The operator-facing proportion maps onto the parity shard count, and shard size is
derived from the blob so that a shard is never smaller than an NTFS cluster:

- `shardSize = clamp(4 KiB, roundUpTo4KiB(ceil(size / 32)), 1 MiB)`, at least one
  cluster, so a single bad cluster damages exactly one shard.
- `dataShards = min(32, ceil(size / shardSize))`, splitting a blob into independent
  32-shard groups above `32 × 1 MiB` so GF(256)'s 255-shard ceiling never binds and
  throughput stays flat.
- `parityShards = clamp(1, round(proportion × dataShards), 32)`.
- **Default 10% once enabled**: 32+3, recovering any 3 of 35 shards, so up to 9.4% of
  the blob in any distribution including a contiguous run. Sane bounds are ~3%
  (1 shard, 1800 MB/s) to 50% (16 shards, 112 MB/s); the throughput cost is linear in
  the proportion, so the setting's help text should say so.
- **Minimum blob size 32 KiB.** Below that the shard floor forces overhead up:
  32 KiB gives 8+1 at 12.8%, 16 KiB gives 4+1 at 25.6%, 8 KiB gives 2+1 at 50.7%.
  Skip parity under 32 KiB and let those blobs fall through the existing ladder.

**Reed-Solomon corrects erasures**, so the repair path has to work out which
shards are bad before it can decode. The sidecar therefore carries an 8-byte truncated
digest per shard (280 B at 35 shards, negligible), and repair recomputes those digests
to locate damage. This is a real addition to the sidecar format build item, not a
change of direction.

### 4. Real overhead

At the default, per blob: 12.8% at 64 KiB, 9.5% at 256 KiB, 9.4% from 1 MiB up. Shard
sizing is cluster-aligned so padding is zero at every size measured. Over a document
and photo mix weighted to a long tail of small files (45% 8 KiB, 25% 64 KiB, 15%
256 KiB, 10% 1 MiB, 4% 4 MiB, 1% 32 MiB), **store overhead is 9.7%**, and 9.6% once
blobs under 32 KiB are skipped.

`#ensureFloor` should reserve `size × 1.13` for a covered blob: the worst case at the
default is 12.8% at the 32 KiB floor rather than the 9.4% asymptote.

**This feeds the deferred cache-copy question.** Covering facility cache copies would
cost about 10% of the cache budget rather than doubling anything on disk. The plan's
"competes with the cache budget" framing is stronger than the measured cost warrants,
so that trade is closer to free than assumed; still a product call, and still deferred.

### 5. Streaming

Each parity shard is an accumulation over all data shards, so parity accumulators are
the only thing that must stay resident: **memory is `shardSize × (1 + parityShards)`**,
which is ≤ 4 MiB at the default and independent of blob size.

Encode needs the blob size up front to pick a shard size, which admission does not have
while streaming. It does have the staged temp file: run parity as a second pass over it
once `#writeAndHash` returns, reading shard by shard. The pass is page-cache warm and
the codec is the bottleneck at ~600 MB/s. Repair streams the same way, into the temp
file that `#placeAtFinalPath` then moves.

### 6. Reconstruction

Against seeded corruption at 1 MiB, 32+3 (whole 4 KiB clusters overwritten with random
bytes, digests locating the damage):

- 1 shard damaged: reconstructed, blob hash equals the original.
- 3 shards damaged (exactly the budget): reconstructed, hash equal.
- 4 shards damaged: fails cleanly as too few shards present, no bytes emitted.
- 5 contiguous shards damaged: fails cleanly.
- Damage spanning data and parity shards (1 data + 1 parity, 1 data + 2 parity):
  reconstructed, hash equal.
- Parity shard damaged with the blob intact: the blob verifies, and regenerating the
  sidecar from the blob reproduces the original parity byte for byte.
- Damage deliberately mislocated (a good shard marked missing, the damaged one left
  marked present): **decode reports success and emits wrong bytes.** The whole-blob
  hash catches it, and it is the only thing that does, so the spec's
  verify-before-place rule has to stay unconditional on the repair path. This is
  inherent to erasure decoding rather than a property of this codec.

Results are identical across repeated calls in one process, which is the property the
WASM package failed.

### 7. Sans-io boundary

The codec is pure computation over typed arrays with no dependencies and no io, so it
**lives inside `packages/blobs`** without qualification, and runs on Hermes if mobile
coverage is ever wanted. Only the sidecar read and write are io, which sits with the
rest of the store's io on whichever side of S2's seam the store's file access lands.
Nothing here pins parity to the server. par2 would have: a child process is io, and it
would force parity above the boundary.

### What this changes

- Sidecar format carries per-shard digests as well as parity shards, since decode needs
  to locate damage.
- The codec is a new module inside `packages/blobs`, which strengthens the existing
  sequencing note: build R2 after S2.
- `#ensureFloor` reserves 13% rather than 10%.
- Skip blobs under 32 KiB, so coverage is a size predicate as well as a tier predicate.
- Settings need the proportion documented as costing throughput linearly, since an
  operator setting 50% pays 5x the encode time of the default.

## Build

- [ ] Settings: per-server enable and parity proportion under the existing
      `blobStorage` subtree in `central.ts` and `facility.ts`
- [ ] GF(256) Reed-Solomon codec in `packages/blobs`: encode, reconstruct, and the
      shard geometry from blob size and proportion
- [ ] Parity sidecar layout and read/write/delete helpers, sharing the blob's fan-out
      path with a suffix that `blobHashFromPathSegments` rejects, so `storedHashes`
      keeps skipping it. Carries per-shard digests alongside the parity shards
- [ ] Registry columns for parity presence and correction count/time, plus migration
      and the dbt model regeneration
- [ ] Write parity on admission for covered blobs above the 32 KiB floor, as a second
      pass over the staged temp file; reserve 13% in `#ensureFloor`; discard it on
      delete and on outbox demotion
- [ ] Correction attempt ahead of quarantine in both healers, recording a repair as
      verified rather than escalating
- [ ] Scrub pass generates parity for covered blobs that lack it, rate-limited the
      same way the verification pass is
- [ ] Correction-rate health signal: query-cookbook row, healthcheck, runbook
- [ ] Tests: seeded corruption within and beyond the parity budget, retrofit over an
      existing store, outbox demotion discarding parity, admission refused when blob
      plus parity would cross the free-disk reserve
