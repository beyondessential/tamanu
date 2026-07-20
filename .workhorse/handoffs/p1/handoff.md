# Handoff: P1 — Add sync_lookup self-healing behaviour

You are picking up work on a Tamanu card that is still in its early, spec-shaping phase. Read this whole doc before doing anything.

## 1. Workhorse context

This repo uses Workhorse, a spec-driven development workbench. The workflow:

- **Specs** live in `specs/` as structured markdown — YAML frontmatter with a single `id` field, an H1 title, and `## sections` containing `- [ ]` checkbox acceptance criteria. The relevant area here is `specs/sync/`.
- Specs **describe the system as it should be**, not the changes to make. Acceptance criteria are *facts* about behaviour, written declaratively (a coherent snapshot, not a changelog). No "used to", "now does", "rather than".
- **Grade implementation detail by whether a reimplementation must be held to it.** This is a backend sync card, so load-bearing technical choices (the healing strategy, ordering guarantees, what the trigger stores, the migration-gate) *belong* in the criteria. Keep incidental detail out. Product-facing wording stays behavioural.
- **Prefer folding into existing specs** over creating new files. Check `specs/sync/` first — a self-healing section may belong inside an existing sync-lookup spec rather than a new file. Read `.agents/docs/spec-format.md` for the full fold-vs-create guidance.
- The card's **working doc** is at `.workhorse/working-docs/p1/working-doc.md` — a drafting space where spec-level and implementation thinking co-exist before being split into specs/plan/test-cases. Read `.agents/docs/working-doc-format.md` for its shape and voice. **This is where your output goes for now** (see Focus below), *not* into specs yet.
- The card's **plan** (tech design + build checklist) lives at `.workhorse/plans/p1/` if/when created; **test cases** at `.workhorse/test-cases/p1/overview.md`.
- Australian/NZ English spelling throughout (colour, finalise, behaviour).
- Follow the repo's own rules in `AGENTS.md` / `CLAUDE.md` — especially `packages/database/CLAUDE.md` (never mix DDL and DML in one migration; write mobile TypeORM migrations alongside server Sequelize migrations; update dbt models under `database/model/` after schema changes) and `llm/project-rules/` (git workflow, conventional commits, sequelize managed transactions).

## 2. Card context

**Title:** Add sync_lookup self-healing behaviour
**ID:** P1
**Description (verbatim from the card):**

> A common issue we face with sync in production is the sync lookup table falling out of sync with the source database. This typically happens during migrations, as those changes don't bump the sync tick.
>
> Solution:
> - Introduce `last_modified_sync_tick` column to the sync_lookup table
>   - Store the global sync tick for the time the source record was last modified
> - Add a trigger to all syncing tables that bumps the `last_modified_sync_tick` in the lookup table
>   - If the record doesn't exist in the lookup table yet, create a stub record
> - When building the lookup table
>   - First do the normal build
>   - Then for all records that have `sync_lookup.sync_tick < last_modified_sync_tick`, rebuild that record without bumping `sync_lookup.sync_tick`
>   - Or maybe we use a boolean… still workshopping this
> - If we find a record that needs rebuilding where the source record doesn't exist, we delete it from the sync_lookup table
>
> Separately we add a 'rebuild the lookup table' step to the end of the migrations process so that we block an upgrade until the lookup table is in a good state.

Note the card description is a proposed solution, not settled acceptance criteria — the "boolean vs tick comparison" question is explicitly open.

## 3. Branch instructions

The card branch is `workhorse/p1`. Do not switch branches in the user's working tree — check it out in a dedicated worktree:

```
git fetch origin
git worktree add ../tamanu-p1 workhorse/p1
cd ../tamanu-p1
git pull   # ensure this committed handoff doc and any later work are present
```

Diff the branch against `main` to see what exists so far:

```
git log main..HEAD --oneline
git diff main...HEAD
```

At time of writing the only card commit is the working-doc scaffold — there is no implementation and no spec yet.

## 4. Journal summary

- The working doc was scaffolded (frontmatter, title "Sync lookup self-healing", one-line overview) — body sections are intentionally empty.
- The user then asked to be interviewed to develop acceptance criteria. Grounding began by reading `packages/central-server/app/sync/updateLookupTable.js` and `packages/database/src/models/SyncLookup.ts`.
- The interview was interrupted before any criteria were captured, and the user asked for this handoff. So: **no acceptance criteria have been developed yet.** The design questions in the card description are all still open.

## 5. Conversation context / what we learned from the code

Key findings to build on (verify against current code — these were read during exploration):

- **`sync_lookup` is central-only**, `DO_NOT_SYNC` (`packages/database/src/models/SyncLookup.ts`). It's a denormalised snapshot table (`record_id`, `record_type`, `data`, `updated_at_sync_tick`, plus `patient_id`/`facility_id`/`encounter_id`/`is_lab_request`/`updated_at_by_field_sum`/`is_deleted`/`pushed_by_device_id`) that sync reads from to build outgoing snapshots. The new `last_modified_sync_tick` column goes here.
- **The build already has a per-model full-rebuild mechanism.** `packages/central-server/app/sync/updateLookupTable.js` (`updateLookupTableForModel`) does an `INSERT ... ON CONFLICT (record_id, record_type) DO UPDATE`, and takes a `shouldFullyRebuild` flag. Rebuild state is tracked via `LocalSystemFact.isLookupRebuildingModel` / `markLookupModelRebuilt` (`packages/database/src/models/LocalSystemFact.ts`). This is the machinery the self-heal pass should build on rather than reinvent.
- **The row-populating SELECT** is `packages/database/src/sync/buildSyncLookupSelect.ts` (per-model overrides via `model.buildSyncLookupQueryDetails`). The self-heal rebuild of a single record must reuse this so healed rows are identical to normally-built ones.
- **Sync tick flags** in `packages/database/src/sync/constants.ts`: `SYNC_TICK_FLAGS` = `{ INCOMING_FROM_CENTRAL_SERVER: -1, LAST_UPDATED_ELSEWHERE: -999, LOOKUP_PENDING_UPDATE: -2, OVERWRITE_WITH_CURRENT_TICK: 0 }`. Note there is *already* a `LOOKUP_PENDING_UPDATE: -2` flag and an `updateSyncLookupPendingRecords` function — understand how that existing "pending" concept relates to (or overlaps with) the proposed self-heal before adding a parallel mechanism. Any positive value is a real monotonic tick.
- **The existing `set_updated_at_sync_tick` trigger** fires on every insert/update of syncing tables and stamps `updated_at_sync_tick` with the current tick (rewriting `-1`→`-999`, any other value→current tick), unless `local_system_facts.syncTrigger = 'disabled'`. The card proposes a *second* trigger concern: bumping `sync_lookup.last_modified_sync_tick` (and stubbing a lookup row) whenever a source row changes. Investigate whether this rides on the existing trigger or is a new one, and the performance implications of a per-row trigger writing to `sync_lookup` across *all* syncing tables.
- **Prior art for lookup rebuilds during migration** exists: `packages/database/src/migrations/1774925167000-RebuildLookupTableForEncounterHistoryChangeType.ts`, `1775783404000-RebuildLookupTableForTaskDesignations.ts`, and PR #9820 (rebuild procedures sync lookup). Also `packages/shared/src/utils/refreshChildRecordsForSync.js`. These show the established pattern the card is trying to make automatic/systemic.
- **The migration-gate** ("rebuild lookup at the end of migrations, block upgrade until good"): find where `upgrade`/migrations run (central-server subcommands, `packages/database/src/services/migrations/`) to see where such a step would hook in.

## 6. Focus — what to do

**Do not jump to implementation, and do not write specs yet.** The design has genuinely open questions that need resolving against the real code first. Your job is to **develop the working doc** at `.workhorse/working-docs/p1/working-doc.md` into a well-reasoned draft, using the sections from `.agents/docs/working-doc-format.md` (Behaviour, Implementation options, Open questions, Trade-offs, Testing notes).

Concretely:

1. Investigate the code paths above deeply enough to reason about the design — especially the existing `LOOKUP_PENDING_UPDATE` flag / `updateSyncLookupPendingRecords`, the per-model rebuild machinery, and trigger performance.
2. In the working doc, write up the **behaviour** the self-heal should have (happy path: build then heal stale rows; the stub-row-on-source-change path; the delete-when-source-gone path; the migration gate that blocks upgrade until the lookup is consistent).
3. Lay out the **open questions** as a checklist and give each a reasoned recommendation:
   - **Boolean flag vs `sync_tick < last_modified_sync_tick` comparison** — weigh both against how the build query and existing flags work. This is the central open question.
   - Whether healing rebuilds a row **without bumping `updated_at_sync_tick`** (as the card proposes) — confirm this is compatible with how facilities detect changes to pull, and what it means for a facility that already pulled the stale row.
   - Whether the source-change trigger is new or extends `set_updated_at_sync_tick`, and its cost across all syncing tables.
   - How the migration-gate reports/blocks, and its runtime cost on large deployments.
4. Capture **testing notes** (e.g. a migration that mutates data without bumping the tick → self-heal detects and repairs; source row deleted → lookup row removed; healed row byte-identical to a normally-built row).
5. **Present your recommendations back to the user** for the open decisions rather than unilaterally committing to specs. Once decisions are made, the card can be split (Workhorse "Split working doc") into `specs/sync/`, the plan, and test cases.

Announce working-doc edits briefly as you make them. Keep everything in working voice (open questions and trade-offs welcome) — it is not a declarative spec yet.

## Cleanup

Once you have read this handoff and no longer need it, delete `.workhorse/handoffs/p1/handoff.md` and commit the deletion — it is a transient artefact that should not linger on the branch.
