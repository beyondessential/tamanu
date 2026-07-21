# Handoff: P1 (TAM-6930) — implement sync_lookup self-healing

You are picking up implementation of a Tamanu card whose **design is complete** — spec, plan, and test
cases are written and committed. Your job is to build it. Read this whole doc first.

## 1. Workhorse context

This repo uses Workhorse, a spec-driven workbench (see `AGENTS.md`). The artefacts for this card:

- **Spec** — `specs/sync/lookup-table.md` (id `LOOKUP`). Describes the system as it should be;
  acceptance criteria are facts about behaviour. This is a backend/sync spec, so load-bearing
  technical choices (healing strategy, trigger mechanics, ordering) are deliberately named in the
  criteria and must be preserved.
- **Plan** — `.workhorse/plans/p1/plan.md`. The build checklist plus design notes and rationale.
  **This is your primary working document.** Tick items (`- [ ]` → `- [x]`) as you complete them and
  expand any step that turns out larger than expected.
- **Test cases** — `.workhorse/test-cases/p1/overview.md`. Concrete scenarios; tick them as automated
  tests land. Each cites the spec criterion it verifies.

Follow the repo rules: `packages/database/CLAUDE.md` (never mix DDL and DML in one migration; update
the dbt source models under `database/model/` after schema changes), `llm/project-rules/` (conventional
commits `type(scope): TAM-6930: description`, managed Sequelize transactions — don't pass the
transaction object). Australian/NZ English throughout. Note: this is **central-server-only**
infrastructure, so no mobile (TypeORM) migration is needed — call that out in the PR so it reads as
deliberate.

## 2. Card context

**P1 (Linear TAM-6930)** — "Add sync_lookup self healing behaviour". The `sync_lookup` table (a
central-only denormalised snapshot that outgoing sync reads from) drifts from its source tables when
migrations change data without advancing the sync clock. This card adds a self-healing layer: flag
drifted records, heal them from source on the next build without re-triggering facility re-pulls, prune
hard-deleted records, and gate upgrades until the lookup table is consistent.

## 3. Branch

Work on `workhorse/p1`, checked out in a **worktree** so the user's tree is undisturbed (you should
already be here if you followed the pointer prompt). Diff against `main` to see what the card has added
so far — it is all design artefacts (spec/plan/test-cases/working-doc), **no implementation code yet**:

    git log main..HEAD --oneline
    git diff main...HEAD -- specs .workhorse

## 4. Journal — how we got here

The card was scoped through an interview, then the design was worked through in conversation and folded
into the spec, which was then reviewed fresh-eyes. A key pivot happened during review: the original
"separate always-firing trigger" design was rejected in favour of **Option B** (below) to avoid
`sync_lookup` write contention against the 20s rebuild job. The plan and spec both reflect Option B.
Two verification items were left for implementation time (section 6).

## 5. The design (Option B) — read the plan for full detail

The authoritative design is in `.workhorse/plans/p1/plan.md`; this is the shape of it:

- **`needs_rebuild` boolean** column on `sync_lookup` (not a tick comparison), plus a **partial index**
  `WHERE needs_rebuild`, and **`data` relaxed to nullable** for stub rows. No backfill (default false).
- **Flagging folds into `set_updated_at_sync_tick`**, not a separate trigger. Clock-advancing writes
  just bump the tick and never touch `sync_lookup` (keeps the hot path free of contention). Only the
  trigger's **disabled mode** flags the lookup row `needs_rebuild` (and stubs one if absent).
- **Two axes decided at install via a trigger argument** (`TG_ARGV[0]`): the flag branch runs only for
  lookup-tracked tables (pull/bidirectional) and only on central. The Node install code passes `'true'`
  for those tables, `'false'`/absent otherwise. One function, no variants, no facts.
- **Migrations disable the trigger instead of dropping it**: change `runPreMigration` to set
  `syncTrigger = 'disabled'` (leave the trigger installed); `runPostMigration` restores it. So
  migration writes are flagged without churning ticks.
- **Hard deletes**: a separate `AFTER DELETE` trigger on lookup-tracked tables **directly deletes** the
  matching `sync_lookup` row (not flag-and-defer — deferring risks shipping a phantom record). Fires
  always, stays active during migrations. Soft deletes are ordinary updates, no special handling.
- **Two-pass build** in `updateLookupTable.js` / `CentralSyncManager.updateLookupTable`: pass 1 is the
  existing incremental build, extended to set `needs_rebuild = false` on rows it writes. Pass 2 heals
  rows still flagged, rebuilding data from source and setting the tick **from the source record**
  (reuse `buildSyncLookupSelect`'s historicalRecordSyncTick behaviour), without routing through the
  `-2` pending sweep. Pass 2 also deletes flagged rows whose source is gone (backstop to the delete
  trigger). Runs in the same transaction as pass 1.
- **Snapshot exclusion**: add `AND data IS NOT NULL` to `snapshotOutgoingChangesFromSyncLookup` so
  stubs are never sent to a facility.
- **Migration gate**: after migrations on central, run the two-pass build and assert zero
  `needs_rebuild` rows remain, blocking the upgrade otherwise. Home it in the central-server upgrade
  subcommand (`packages/central-server/app/subCommands/upgrade.js`, check `migrate.js`) after
  `upgrade()` — the rebuild logic lives in `@tamanu/central-server`, which `@tamanu/upgrade` must not
  import. Guard it for `--dry-run`.

## 6. Resolve these two first — they gate the trigger work

1. **Is `sequelize.models` (with sync directions) available inside `runPostMigration`?** It currently
   uses only config + raw SQL. The trigger install needs the pull/bidirectional table set
   (`getModelsForPull` / `getModelsForDirection`) to pass the `TG_ARGV` boolean. If models aren't
   available there, thread the table list in.
2. **Confirm nothing relied on `set_updated_at_sync_tick` being physically *absent* during migrations**
   before switching `runPreMigration` to disable-not-drop. The disabled branch passes `NEW` through
   untouched, matching the old dropped behaviour — but check for migrations that set
   `updated_at_sync_tick` by hand.

## 7. Focus — build it

Work through the plan checklist in `.workhorse/plans/p1/plan.md`, roughly in this order: schema
migration → trigger changes + migration hooks → two-pass build → snapshot exclusion → migration gate →
dbt regeneration. Tick plan items as you go. Write central-server integration tests against a real DB
(`packages/central-server/__tests__/sync/`) and migration-hook tests
(`packages/database/__tests__/services/migrations/`) covering the scenarios in the test-cases file, and
tick those as they land. Grounding references (verify against current code): `updateLookupTable.js`,
`CentralSyncManager.js` (~line 320), `buildSyncLookupSelect.ts`, `snapshotOutgoingChanges.js`,
`migrationHooks.ts`, and `000_baseline.sql` (`set_updated_at_sync_tick`, `flag_lookup_model_to_rebuild`).

Open a PR titled `feat(sync): TAM-6930: add sync_lookup self healing behaviour` using the repo's PR
template.

## Cleanup

Once you've read this handoff and no longer need it, delete `.workhorse/handoffs/p1/handoff.md` and
commit the deletion — it's a transient artefact that shouldn't linger on the branch.
