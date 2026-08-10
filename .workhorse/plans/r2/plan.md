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

Blocks the build. Same shape as E2's BLAKE3 spike. See
`.workhorse/handoffs/r2/handoff.md` for the full brief.

- [ ] Confirm a maintained Reed-Solomon (or par2) implementation usable from Node on
      Windows and Linux, with no unmaintained native build step
- [ ] Benchmark encode throughput against BLAKE3/SHA-256 hashing on the same bytes,
      since parity rides the admission path
- [ ] Establish the parameter shape: shard count and shard size versus the
      operator-facing proportion the spec specifies, and how a proportion maps onto it
- [ ] Measure real overhead and sidecar size at a representative blob size mix
- [ ] Confirm streaming encode is possible, or record the memory ceiling if the
      library needs the whole blob resident
- [ ] Verify reconstruction actually works against seeded corruption, including
      corruption that exceeds the parity budget (must fail cleanly, not silently
      produce wrong bytes that then fail the hash check)
- [ ] Report whether the codec can live in the sans-io `packages/blobs` boundary S2
      is drawing

## Build

- [ ] Settings: per-server enable and parity proportion under the existing
      `blobStorage` subtree in `central.ts` and `facility.ts`
- [ ] Parity sidecar layout and read/write/delete helpers, sharing the blob's fan-out
      path with a suffix that `blobHashFromPathSegments` rejects, so `storedHashes`
      keeps skipping it
- [ ] Registry columns for parity presence and correction count/time, plus migration
      and the dbt model regeneration
- [ ] Write parity on admission for covered blobs; account for it in `#ensureFloor`;
      discard it on delete and on outbox demotion
- [ ] Correction attempt ahead of quarantine in both healers, recording a repair as
      verified rather than escalating
- [ ] Scrub pass generates parity for covered blobs that lack it, rate-limited the
      same way the verification pass is
- [ ] Correction-rate health signal: query-cookbook row, healthcheck, runbook
- [ ] Tests: seeded corruption within and beyond the parity budget, retrofit over an
      existing store, outbox demotion discarding parity, admission refused when blob
      plus parity would cross the free-disk reserve
