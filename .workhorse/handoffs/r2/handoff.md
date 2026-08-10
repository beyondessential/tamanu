# Handoff: R2 implementation

You are implementing the Tamanu card **R2 · Optional error correction for blob
storage**. The specs are finished, the decisions are taken, and the gating research
spike has reported. Your job is the build checklist in `.workhorse/plans/r2/plan.md`.

## 1. How this repo works (Workhorse)

Tamanu uses Workhorse, a spec-driven workbench.

- **Specs** live in `specs/{area}/{slug}.md` as markdown with YAML frontmatter (a short
  stable `id`) and checkbox acceptance criteria. They describe the system as it should
  be, in the present tense. Code references them with `// spec: ID` comments, which is
  an established convention in the blob store code you are extending. Follow it.
- **The card's plan** is `.workhorse/plans/r2/plan.md`. Read it in full before writing
  anything. It carries the decisions, the spike findings with measured numbers, and the
  build checklist. Tick items (`- [ ]` → `- [x]`) as they complete, and expand a step
  into sub-items if it turns out larger than anticipated.
- **Test cases** for the card go at `.workhorse/test-cases/r2/overview.md`. Create it as
  scenarios surface and cite the spec id where a case verifies a criterion.
- Australian/NZ English throughout: colour, organisation, finalise, cancelled.
- Repo conventions are in `AGENTS.md` and `llm/project-rules/`. Read
  `llm/project-rules/coding-rules.md` before writing code, and
  `packages/database/CLAUDE.md` before writing the migration.

## 2. The card

**R2 · Optional error correction for blob storage**, in `beyondessential/tamanu`, part
of the content-addressed blob storage epic (B2).

> An off-by-default parity sidecar for substrates that lack their own redundancy,
> chiefly NTFS bare metal, so a single isolated copy can self-repair limited corruption
> before falling through to peer or backup. Correction-rate telemetry doubles as an
> early warning of failing media. Shares the scrub's detect-and-repair path.

The epic stores attachments and assets as content-addressed blobs on the filesystem
(two-level `ab/cd/<rest>` fan-out, algorithm-tagged hashes, a local non-syncing `blobs`
registry) instead of in Postgres `bytea` columns. The full card breakdown is at
`.workhorse/plans/b2/card-plan.md`; R2 is the last entry.

## 3. Getting the branch, and the S2 dependency

**Read this section before checking anything out.** R2 has a hard dependency on an
unmerged branch.

The spike concluded the parity codec belongs in `packages/blobs`, the dependency-free
sans-io package that card **S2** is extracting from `@tamanu/database` and the two
servers. That package exists only on `origin/workhorse/s2`, which is still an open PR
(#10711) and roughly 49 commits ahead of the epic branch. S2 also rewrites
`BlobStore.ts` and both transfer paths, which is precisely the surface parity hooks
into, so building against the pre-S2 shape would mean writing code against seams that
are about to move.

So: check R2 out in a **git worktree** rather than switching branches in the user's
working tree, then merge S2 into it.

```
git fetch origin
git worktree add ../tamanu-r2 workhorse/r2
cd ../tamanu-r2
git merge origin/workhorse/s2
```

Consequences to work with, not around:

- Keep your R2 commits clearly separate from the merged S2 history. When S2 lands on the
  epic branch, R2 gets rebased or re-merged onto it and S2's commits fall out of R2's
  diff.
- R2's eventual PR targets the epic branch `workhorse/b2`, and should not be opened
  until S2 has merged, or it will show 49 commits that are not R2's work.
- If S2's package boundary shifts under you, follow it rather than working around it.
  Raise it if the shift makes the codec's placement wrong.

Read before starting:

- `.workhorse/plans/r2/plan.md` — decisions, spike findings, build checklist
- `specs/blob-storage/error-correction.md` (FEC) — the spec you are implementing
- `specs/blob-storage/integrity.md` (SCRUB) — the scrub and the self-heal ladder that
  parity becomes the first rung of
- `specs/blob-storage/content-addressing.md` (CAS) — store layout and the admission path
- `specs/blob-storage/capacity.md` (CAP) — the free-disk floor parity has to fit inside
- `specs/blob-storage/facility-cache.md` (CACHE) — the outbox and cache tiers that
  coverage is predicated on

## 4. What has happened so far

The B2 epic broke into 13 cards. All have landed on the epic branch except Q2
(antivirus) and S2 (above). R2 had only a 35-line epic-level spec sketch and no plan.

In one session the spec was finished, six open questions were closed, a codec research
spike was briefed out and has since reported, and its findings were folded back into the
spec and plan. No R2 implementation code exists yet. The build checklist is the
remaining work in its entirety.

## 5. Decisions already taken

These are settled and written into the spec. Do not relitigate them; if implementation
shows one of them is wrong, say so explicitly rather than quietly building something
else.

- **Coverage is per server, over durable copies only.** Every blob on central, outbox
  blobs on a facility. Cache copies and mobile are uncovered. Blobs under 32 KiB are
  skipped, because a parity shard is at least one filesystem cluster and the overhead
  outgrows the blob below that. Coverage is therefore a tier predicate and a size
  predicate.
- **Retrofit through the scrub.** Parity is written inline at admission, and the scrub
  generates it for any covered blob that lacks it, so enabling error correction on a
  server that already holds blobs protects its existing content over one scrub cycle.
- **A failed parity write does not fail the admission.** The blob is stored unprotected
  and the scrub picks it up later.
- **Repair is in place, through the atomic placement path.** Reconstruct into a temp
  file, verify against the blob's hash, then place. Note `put()` deliberately refuses to
  replace bytes already stored under a hash (`existed: true` wins, quarantined bytes
  included), so repair needs its own placement call rather than a `put`.
- **The hash check on a reconstruction is unconditional.** The spike demonstrated that
  if the damaged region is located wrongly, decode reports success and emits different
  bytes. The whole-blob hash is the only thing that catches this. Never make that check
  conditional, and never skip it as an optimisation.
- **Correction rate is its own health signal**, separate from `blob_integrity`, because
  the operator response is to replace the media rather than recover the content.
- **Parity is derived, never a fault.** Damaged or missing parity over a blob that
  verifies is regenerated. Store captures exclude it. It dies with its blob on delete
  and on outbox demotion.

## 6. One thing that may still change

Whether facility **cache** copies should be covered too is deferred, not closed, and the
plan says to revisit it before build starts. The spike measured the cost at about a
tenth of the cache budget, which is far less than was assumed when it was set aside, so
it may widen.

Build outbox-only, as the spec says. But **write coverage as a single predicate over
the blob's tier and size in one place**, so widening it is a one-line change and not a
hunt through the codebase. Check with the user before starting the coverage work in case
it has been settled since this was written.

## 7. Your task: the build checklist

Work the checklist in `.workhorse/plans/r2/plan.md`. The spike section directly above it
gives you the shard geometry, the default proportion, the memory bound, and the measured
throughput, so you should not need to rediscover any of it.

Order that respects the dependencies:

1. **Codec** in `packages/blobs`: GF(256) systematic Reed-Solomon, encode and
   reconstruct, plus the shard geometry derived from blob size and the configured
   proportion. Pure computation over typed arrays, no io, no dependencies. Unit tests
   with seeded corruption come with it, not after it.
2. **Sidecar format**: parity shards plus the per-shard digests that let repair locate
   damage. Shares the blob's fan-out path with a suffix that `blobHashFromPathSegments`
   rejects, so the store walk in `storedHashes` keeps skipping it. Verify that it does.
3. **Settings**: per-server enable and parity proportion under the existing `blobStorage`
   subtree in `packages/settings/src/schema/{central,facility}.ts`. The proportion costs
   encode throughput linearly, so say so in the description. See
   `llm/project-rules/settings.md`.
4. **Migration**: registry columns for parity presence and correction count and time.
   DDL only, never mixed with DML in one migration, and regenerate the dbt source models
   afterwards (`npm run dbt-generate-model`, fill the TODOs, `npm run dbt-check-todos`).
   No mobile TypeORM migration is needed, since mobile is uncovered.
5. **Admission**: write parity as a second pass over the staged temp file once
   `#writeAndHash` returns and the size is known. Reserve 13% rather than 10% in
   `#ensureFloor` for a covered blob. Discard parity on delete and on outbox demotion.
6. **Healers**: a correction attempt ahead of quarantine in both
   `CentralBlobHealer` and `FacilityBlobHealer`, recording a successful repair as
   verified rather than escalating it. Both currently quarantine straight away on
   `BLOB_FAULTS.CORRUPT`.
7. **Scrub**: generate parity for covered blobs that lack it, rate-limited the same way
   the verification pass is.
8. **Health signal**: correction-rate row in `docs/reference/query-cookbook.md`, the
   healthcheck, and a runbook alongside `docs/runbooks/blob-integrity.md`.

### Testing

Integration tests for the servers follow `llm/project-rules/endpoint-integration-tests.md`.
Run what you touch:

```
npm run --workspace @tamanu/central-server test
npm run --workspace @tamanu/facility-server test
npx eslint $(git diff --name-only --diff-filter=d HEAD | grep -E '\.(ts|js|mjs)$')
```

The cases the plan already names: seeded corruption within and beyond the parity budget,
retrofit over a store that predates the feature, outbox demotion discarding parity, and
admission refused when blob plus parity would cross the free-disk reserve. Add cases to
`.workhorse/test-cases/r2/overview.md` as you find scenarios worth verifying, whether or
not you automate them.

### Commits

Terse lowercase subjects, roughly three words, no conventional-commit prefix and no
ticket number on individual commits, no `Co-Authored-By` trailer. PR titles are the
exception and are CI-enforced: `type(scope): TICKET-123: description`, or `no-issue` in
place of the ticket. See `llm/project-rules/pull-requests.md`.

### When you are done

Delete this handoff and commit the deletion, since it is a point-in-time artefact that
should not linger on the branch:

```
rm .workhorse/handoffs/r2/handoff.md
git add -A .workhorse/handoffs
git commit -m "clear r2 handoff"
```
