# Handoff: R2 parity codec research spike

You are picking up a research spike on the Tamanu card **R2 · Optional error
correction for blob storage**. The spike gates the build: nothing in the
implementation checklist should start until it reports.

## 1. How this repo works (Workhorse)

Tamanu uses Workhorse, a spec-driven workbench. What you need to know:

- **Specs** live in `specs/{area}/{slug}.md` as markdown with YAML frontmatter (a
  short stable `id` used for `// spec: ID` traceability comments in code) and
  checkbox acceptance criteria. They describe the system as it should be, in the
  present tense, never as a changelog of what to change.
- **The card's plan** lives at `.workhorse/plans/r2/plan.md`. Read it first. It is a
  free-form working document: tech design notes plus a build checklist. Tick items
  (`- [ ]` → `- [x]`) as they complete, and expand a step into sub-items if it turns
  out larger than anticipated.
- **Test cases**, if the card grows any, live at `.workhorse/test-cases/r2/overview.md`.
- Australian/NZ English spelling throughout: colour, organisation, finalise.
- Repo conventions live in `AGENTS.md` and `llm/project-rules/`. Read
  `llm/project-rules/coding-rules.md` before writing code.

## 2. The card

**R2 · Optional error correction for blob storage**, in the Tamanu workspace
(`beyondessential/tamanu`), part of the Storage epic.

> An off-by-default parity sidecar (Reed-Solomon) for substrates that lack their own
> redundancy, chiefly NTFS bare metal, so a single isolated copy can self-repair
> limited corruption before falling through to peer or backup. Correction-rate
> telemetry doubles as an early warning of failing media. Shares the scrub's
> detect-and-repair path.

R2 was spun off from **B2 · Content-addressed blob storage epic**, which stores
attachments and assets on the filesystem as content-addressed blobs (two-level
`ab/cd/<rest>` fan-out, algorithm-tagged hashes, a local non-syncing `blobs` registry)
instead of in Postgres `bytea` columns. The epic's card breakdown is at
`.workhorse/plans/b2/card-plan.md`; R2 is the last entry.

Note the card description says SHA-256; the epic later moved to BLAKE3 in the plan
while `specs/blob-storage/content-addressing.md` still specifies SHA-256. Treat the
hash algorithm as settled elsewhere and out of scope for this spike, but do benchmark
against whichever the branch actually implements (`CURRENT_BLOB_HASH_ALGORITHM` in
`packages/database/src/blobStore/`).

## 3. Getting the branch

Check the card branch out in a **git worktree** rather than switching branches in the
user's working tree:

```
git fetch origin
git worktree add ../tamanu-r2 workhorse/r2
cd ../tamanu-r2
```

The branch is currently identical to `origin/workhorse/b2` (the epic branch) plus this
card's spec and plan. To see what the epic added on top of `main`:

```
git diff --stat origin/main...HEAD -- specs packages
```

Read these before starting:

- `specs/blob-storage/error-correction.md` — the FEC spec, the thing this spike serves
- `specs/blob-storage/integrity.md` — the scrub and the self-heal ladder parity is the
  first rung of
- `specs/blob-storage/content-addressing.md` — the store layout and admission path
- `specs/blob-storage/capacity.md` — the free-disk floor parity has to fit inside
- `.workhorse/plans/r2/plan.md` — the decisions already taken and the build checklist

The code the spike's answers land against:

- `packages/database/src/blobStore/BlobStore.ts` — `#admit`, `#writeAndHash`,
  `#placeAtFinalPath`, `verify`, `storedHashes`, `#ensureFloor`
- `packages/database/src/blobStore/BlobScrubber.ts` — `#verificationPass`,
  `#reconciliationPass`
- `packages/central-server/app/blobIntegrity/CentralBlobHealer.js` and
  `packages/facility-server/app/blobIntegrity/FacilityBlobHealer.js` — the heal path
  parity slots ahead of

## 4. What has happened so far

The B2 epic has been broken into 13 cards. All of them have landed on the epic branch
except **Q2** (antivirus) and **S2** (extract a sans-io `packages/blobs` package shared
with mobile), which are still in flight. R2 has not been started: the spec was drafted
at epic level as a 35-line sketch, and has since been finished on this branch (coverage
model, retrofit, repair semantics, capacity accounting, telemetry surface). The plan was
written at the same time. No R2 code exists.

Six open questions were worked through and closed. They are recorded under "Decisions
taken" in the plan, and are already written into the spec. The short version:

- Coverage is per server over durable copies only: every blob on central, outbox blobs
  on a facility, nothing on mobile, nothing on facility cache copies
- Parity is written at admission and retrofitted by the scrub, so enabling it on an
  existing store protects existing content
- Repair reconstructs to a temp file, verifies against the hash, then places atomically
- A failed parity write does not fail the admission
- Correction rate is its own health signal, separate from `blob_integrity`
- Parity is derived: never a fault, excluded from backups, dies with its blob

One judgement call is deliberately left open (whether facility cache copies should be
covered after all, a clinical-availability versus disk-cost trade). It is flagged in the
plan and is the user's to settle. It does not block this spike, but if your findings
change the disk-cost side of that argument, say so.

## 5. Your task: the spike

Answer these, with evidence rather than recollection. Fetch current docs and check
release dates and issue activity rather than relying on training data; several
Reed-Solomon packages in the Node ecosystem are abandoned.

1. **Is there a maintained codec?** A Reed-Solomon or par2 implementation usable from
   Node on both Windows and Linux. Tamanu facility servers run on Windows bare metal,
   so an unmaintained native build step is disqualifying. Pure JS, WASM, and
   well-maintained native bindings are all fair; say which and what the trade is.
   par2 as an external binary invoked like the antivirus scanner is a legitimate
   answer too, and worth pricing against an in-process library.
2. **Throughput.** Benchmark encode against hashing the same bytes on this branch's
   hash implementation. Parity rides the admission path, so if encoding is much slower
   than hashing it changes whether parity can be written inline at admission or has to
   be deferred to the scrub for everything. Report MB/s for both.
3. **Parameter shape.** The spec exposes an operator-facing proportion of blob size.
   Work out how that maps onto the library's actual parameters (shard count, shard
   size, data-to-parity ratio), what the sane bounds are, and what a good default is
   once enabled. Note any minimum blob size below which parity is pointless or the
   overhead is disproportionate.
4. **Real overhead.** Measure sidecar size at a representative blob size mix.
   Attachments in Tamanu are mostly documents and photos: assume a long tail of small
   files with occasional multi-megabyte ones. State the total store overhead at the
   default you recommend.
5. **Streaming.** Confirm whether encode can stream, or record the memory ceiling if
   the library needs the whole blob resident. Admission already streams to a temp file
   while hashing, so a streaming codec composes; a whole-file one needs a memory bound
   argued against the largest blob the deployment allows.
6. **Reconstruction actually works.** Seed corruption at several magnitudes: within the
   parity budget (must reconstruct, and the reconstruction must hash equal to the
   original), and beyond it (must fail cleanly and detectably, never silently emit
   wrong bytes). Also corrupt the parity file itself and confirm a good blob still
   verifies and the parity is simply regenerable.
7. **Sans-io boundary.** S2 is extracting the store logic into a dependency-free
   `packages/blobs` that mobile also consumes (see `origin/workhorse/s2`). Report
   whether your recommended codec could live inside that boundary, or whether it pins
   parity to the server side. The spec already excludes mobile from coverage, so
   server-side-only is an acceptable answer, but S2 needs to know before it draws the
   seam.

### Output

Write findings into `.workhorse/plans/r2/plan.md` as a new "Spike findings" section:
the recommendation, the evidence behind it, the numbers, and anything that changes a
decision already taken. Tick the spike checklist items as you answer them. Keep any
benchmark or proof-of-concept code out of the branch unless it is worth keeping as a
test; if it is, put it where the package's other tests live.

Do not start the build checklist. The spike reports back first.

### When you are done

Delete this handoff and commit the deletion, since it is a point-in-time artefact that
should not linger on the branch:

```
rm .workhorse/handoffs/r2/handoff.md
git add -A .workhorse/handoffs
git commit -m "clear r2 handoff"
```
