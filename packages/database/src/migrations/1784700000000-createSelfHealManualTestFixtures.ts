import { QueryInterface } from 'sequelize';

// MANUAL TEST MIGRATION — not a permanent schema change. This, together with the DML migration
// that follows it (runSelfHealManualTestScenarios), exists purely to exercise the sync_lookup
// self-healing mechanism (spec: specs/sync/lookup-table.md, LOOKUP) end-to-end against a real
// database so the result can be inspected by hand after an upgrade. It should be reverted once
// reviewed — see the commit this lands in.
//
// DDL only, split from the DML migration per packages/database/CLAUDE.md (never mix DDL and DML
// in the same migration): the record_change changelog trigger uses deferred constraint triggers,
// so an ALTER/CREATE TABLE in the same transaction as an UPDATE/DELETE with pending trigger events
// fails.
export async function up(query: QueryInterface): Promise<void> {
  // A brand-new table with no backing Sequelize model. It cannot be lookup-tracked (that requires
  // a model — see isTableLookupTracked in postMigrationHooks), so this is really just a smoke test
  // that introducing an unrelated new table doesn't upset the disable/enable-trigger machinery or
  // the post-migration hooks that add the baseline updated_at_sync_tick column and triggers to
  // every table.
  await query.sequelize.query(`
    CREATE TABLE self_heal_manual_test_widgets (
      id text PRIMARY KEY,
      label text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT current_timestamp
    );
  `);

  // Records what the DML migration did and what a correctly self-healed outcome should look like,
  // so it can be cross-referenced against sync_lookup by hand after the upgrade completes:
  //
  //   SELECT l.*, sl.needs_rebuild, sl.data, sl.updated_at_sync_tick
  //   FROM self_heal_manual_test_log l
  //   LEFT JOIN sync_lookup sl ON sl.record_id = l.record_id AND sl.record_type = l.table_name
  //   ORDER BY l.step;
  await query.sequelize.query(`
    CREATE TABLE self_heal_manual_test_log (
      id serial PRIMARY KEY,
      step integer NOT NULL,
      table_name text NOT NULL,
      record_id text NOT NULL,
      action text NOT NULL,
      detail text NOT NULL,
      logged_at timestamp with time zone NOT NULL DEFAULT current_timestamp
    );
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP TABLE IF EXISTS self_heal_manual_test_log;
  `);
  await query.sequelize.query(`
    DROP TABLE IF EXISTS self_heal_manual_test_widgets;
  `);
}
