# Handoff: Sync self-healing — missing-record phone home (Y1)

You are picking up work on the Tamanu card **Y1 — Sync Self-Healing: missing-record phone home**. Specs and an implementation plan are already committed; your job is to **begin implementation**.

## 1. Workhorse context

This repo uses Workhorse, a spec-driven workflow:

- **Specs** live in `specs/` as markdown with YAML frontmatter (`id`) and checkbox acceptance criteria. They describe the system *as it should be* — acceptance criteria are facts about behaviour, not instructions. Backend/sync specs carry load-bearing technical detail where a reimplementation must be constrained to a specific mechanism; keep product-facing detail behavioural.
- **The card's plan** lives at `.workhorse/plans/y1/plan.md` — a free-form working document with architecture notes and a build checklist. **Read it first.** Tick items (`- [ ]` → `- [x]`) as you complete them, and expand a step into sub-items if it turns out larger than expected.
- **Test cases**, if you add them, go in `.workhorse/test-cases/y1/overview.md`.
- Mockups (none needed here) live in `.workhorse/design/mockups/y1/`; design system at `.workhorse/design/design-system.md`.
- Use **Australian/NZ English** spelling.

Follow the Tamanu project rules in `AGENTS.md` / `llm/project-rules/` — especially: conventional commits (`type(scope): TAM-7007: description`), managed Sequelize transactions without passing the transaction object, never modify `updated_at_sync_tick` by hand *except* via the sanctioned tick-bump (write a positive value and let the `set_updated_at_sync_tick` trigger restamp it), new config belongs in settings not config files, no patient-identifiable data in logs at INFO+, and all endpoints need real permission checks.

## 2. Card context

A recurring class of sync issue: a record is missing on a facility/mobile server and a synced record referencing it fails on a missing foreign key. The manual fix is always to bump the missing record's `updated_at_sync_tick` on central so the next sync delivers it. This card automates that: when a client hits a missing-FK error during sync, it phones the missing `(table, id)` pairs home to central, which re-queues them — guarded against runaway bumping and with visibility into frequency.

Linear issue: TAM-7007 (https://linear.app/bes/issue/TAM-7007).

## 3. Branch instructions

The work is on branch **`workhorse/y1`**. Check it out in a git worktree so your main working tree is undisturbed, and pull the latest so this committed handoff and the specs/plan are present:

- `git fetch origin`
- `git worktree add ../tamanu-y1 workhorse/y1` (or, if you already have it, `git -C ../tamanu-y1 pull --ff-only`)

Then diff the branch against its upstream base (`main`) to see what's been added: `git diff main...workhorse/y1 --stat`. The relevant additions are `specs/sync/self-healing.md` and `.workhorse/plans/y1/plan.md`.

## 4. What has happened so far

- Interviewed the product owner and wrote the spec `specs/sync/self-healing.md` (id `HEAL`), a new sibling under `specs/sync/` (the sync overview was only a stub).
- Wrote the implementation plan at `.workhorse/plans/y1/plan.md`, grounded in the actual sync code paths.
- No code has been written yet.

## 5. Key decisions from the interview (context/continuity)

- **Both facility and mobile** phone home, to **one** central endpoint. Detection differs per client (mobile: `PRAGMA foreign_key_check`; facility: PostgreSQL FK violation out of `saveIncomingChanges`, where constraints are deferred by `withDeferredSyncSafeguards` and asserted at `SET CONSTRAINTS ... IMMEDIATE`). Both send `{ recordType, id }` pairs for the missing *parent* records.
- **The failing sync still fails as it does today.** Phone-home only re-queues records so a *later* sync succeeds; it does not rescue the current session.
- **Central re-queues only when** the record both exists on central and belongs to a syncable model. A record **absent on central** is not bumped and is logged as an unhealable missing reference (real data loss). A **non-syncable** record type is not bumped (bumping would do nothing).
- **Loop guard** keyed on `(facility, record)`: count consecutive sync sessions reporting the same record; once it exceeds the threshold, stop bumping *that record*. No separate alert — the continuing sync failure surfaces through existing sync alerting. The count **resets** as soon as a later session doesn't report that record (whether it succeeds or fails on a different record).
- **Counter is derived, not a new table:** compute the count by reading the device's *previous* sync session's recorded phone-home entries from `debug_info`, and write updated entries into the *current* session's `debug_info` via `SyncSession.addDebugInfo` (best-effort; a lost write can only allow one extra bump — safe).
- **Visibility** goes into `sync_sessions.debug_info`: facility, record type, id, consecutive count, and action taken (`bumped` / `absentOnCentral` / `notSyncable` / `overThreshold` / `overCap`).
- **Two configurable central settings** with defaults: consecutive-failure threshold = **3**, per-request cap = **500**. When a request exceeds the cap, bump the first 500 and log the overflow.
- Left deliberately behavioural in the spec (decide during build): exact settings key names (suggested `sync.selfHealing.maxConsecutiveBumps` / `maxRecordsPerRequest`), and the endpoint route/payload shape.

## 6. Your focus: implement the plan

Work through `.workhorse/plans/y1/plan.md` in order — it is sequenced central-first (settings → re-queue logic → loop guard → endpoint) so the endpoint can be exercised by integration tests before the client wiring, then the facility and mobile clients, then tests. Read `specs/sync/self-healing.md` for the acceptance criteria each step must satisfy.

Notes as you go:
- The re-queue UPDATE should mirror `packages/database/src/sync/bumpSyncTickForRepull.ts`.
- The central endpoint belongs in `packages/central-server/app/sync/buildSyncRoutes.js` (already device-authed and session-scoped); put logic on `CentralSyncManager`, delegating DB work to a new `packages/database/src/sync/` function.
- The mobile step is the least trivial: `foreign_key_check` gives the child table/rowid and parent table but **not** the missing id — resolve it via `PRAGMA foreign_key_list(table)` (map the `fkid`) to find the FK column, then read that column off the child row.
- Confirm no migration is needed — `sync_sessions.debug_info` already exists as a JSON column. If so, skip the dbt/model regeneration steps.
- Tick plan items as you finish them, and add concrete scenarios to `.workhorse/test-cases/y1/overview.md` if that helps track verification.
- Run the relevant test suites (`npm run central-test`, `npm run facility-test`, mobile tests) and lint changed files before pushing.

## Cleanup

Once you have read this handoff and no longer need it, delete `.workhorse/handoffs/y1/handoff.md` and commit the deletion — it is a transient artefact that should not linger on the branch.
