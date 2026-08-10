# Handoff: Q2, antivirus scanning for stored blobs

You are picking up work on a Tamanu card that is partly specified and not yet
started in code. Read this whole document before touching anything.

## 1. How this workspace works

Tamanu uses Workhorse, a spec-driven workbench. The conventions that matter to you:

- **Specs** live in `specs/` as markdown with YAML frontmatter (`id`, a short stable
  code) and checkbox acceptance criteria. They describe the system as it should be,
  not the changes to make. Criteria are facts about behaviour. Implementation detail
  appears only where a reimplementation should be held to that choice, which for the
  blob-storage area is often the case
- Code references a spec with an inline comment, `// spec: AV`, and the blob code
  already does this heavily. Follow the pattern
- **The plan** for this card is at `.workhorse/plans/q2/plan.md`. Read it first. It
  carries the design decisions and the step checklist. Tick items as you complete
  them and expand a step into sub-items if it turns out larger than it looks
- **Test cases** go at `.workhorse/test-cases/q2/overview.md`. This card has none
  yet. Create one as behaviour lands, citing spec ids on cases that verify a
  criterion, and leave uncovered cases unticked rather than deleting them
- Australian/NZ English throughout, in code comments, copy and commit messages
- `AGENTS.md` and `llm/project-rules/` carry the repo's own rules. The ones you will
  hit on this card: settings belong in the settings schema rather than config files,
  migrations never mix DDL and DML, server migrations need mobile (TypeORM)
  counterparts, and schema changes require regenerating the dbt models under
  `database/model/`

## 2. The card

**Q2, Antivirus scanning for stored blobs.**

Optional malware scanning of user-uploaded blobs by actively invoking the host
scanner (clamd, Defender, or ICAP) rather than building one, caching verdicts by
hash and treating a quarantine as a first-class, content-addressed, propagating
state that suppresses self-heal. The serve policy is an administrator setting
following a hardening pathway: off, serve unless known-bad (the default once
enabled), then serve only when known-good. A fast-follow the foundation
accommodates rather than a prerequisite to land the feature; no-op when
unconfigured.

## 3. Branch and worktree

The card branch is `workhorse/q2`. Its upstream is **not** `main`: this card is a
child of the B2 content-addressed blob storage epic and is based on
`origin/workhorse/b2`, which is where all the blob specs and the already-merged
blob implementation come from.

Check it out in a git worktree rather than switching branches in place, so the
user's working tree is left alone: `git fetch origin`, then
`git worktree add ../tamanu-q2 workhorse/q2`. Pull the latest first so this
document is present.

To see what the card inherits, diff against the upstream base:
`git diff origin/workhorse/b2...HEAD`. At the time of writing that diff contains
only this handoff and the plan, so everything else you see is the epic's.

Do not rebase onto `main`. B2 forked from an older main and a plain rebase replays
main's newer commits onto the card, which conflicts in the mobile migrations index.

## 4. What has happened so far

The card was cut from `main` by mistake and could not see any blob spec. It has
been repointed at `origin/workhorse/b2`, so the whole `specs/blob-storage/` area
and the landed implementation are now present. No code has been written for this
card.

A review of the inherited spec against the shipped code found that the base AV
spec is a sound outline but not yet buildable, and two of its gaps were worked
through with the product owner. Those decisions are recorded in the plan. Four
open questions remain, listed there in priority order, and the first of them blocks
most of the work.

## 5. Where to read yourself in

In this order:

1. `specs/blob-storage/antivirus.md` (id AV), the base spec for this card
2. `.workhorse/plans/q2/plan.md`, the decisions and the step list
3. `specs/blob-storage/overview.md`, then `content-addressing.md` (CAS) and
   `integrity.md` (SCRUB), which the decisions interact with directly
4. The code the decisions turn on: `packages/constants/src/blobs.ts`,
   `packages/database/src/blobStore/BlobStore.ts`,
   `packages/central-server/app/blobIntegrity/CentralBlobHealer.js`,
   `packages/central-server/app/attachment.js`
5. `.workhorse/plans/p2/plan.md`, the sibling card that built the scrub and
   self-heal. It is the closest precedent for shape, rate limiting, settings, and
   the runbook and healthcheck work that a card in this area is expected to include

## 6. What to do

Start with the two unblocked steps in the plan, in this order:

1. **Rename the `quarantined` integrity state to `corrupt`.** It currently means
   "failed verification against the hash", and this card needs the word quarantine
   for the propagating malware state. Touches the constants, the model default, the
   mobile migration, both healers, their tests, and the wording in `integrity.md`.
   B2 has not merged to main, so there is no deployed data to migrate, but check
   that before you start
2. **Add the scan columns to `blobs`** (verdict, scanned time, scanner and signature
   version) with the mobile counterpart and regenerated dbt models. These are
   orthogonal to `integrity_state`, exactly as `tier` and `last_scrubbed_at` are.
   Nothing reads them yet

Then stop and check in. Everything after those two depends on open question 1, the
propagation mechanism, which is a product decision the card owner has not yet made.
Do not pick a transport yourself.

Two constraints hold across all of it:

- **The feature no-ops when unconfigured.** A deployment with no scanner must see no
  change to ingest latency, serving, or the scrub
- **Infected content is never healed.** When you get to it, note that three shipped
  behaviours currently work against this: the healer repairs corrupt blobs from a
  peer or backup, `commitStaged` clears a non-verified state when good bytes arrive,
  and central's offer route answers `wanted` for a quarantined copy so a facility can
  heal it. Each needs an explicit exemption for a known-bad hash

If you find the spec unclear or contradictory while implementing, do not guess.
Surface it and propose a spec edit. If a behavioural decision is missing, that is a
question for the card owner in Workhorse, not something to invent in code.

## 7. Cleanup

Once you have read this and no longer need it, delete
`.workhorse/handoffs/q2/handoff.md` and commit the deletion. It is a transient
point-in-time artefact and should not linger on the branch.
