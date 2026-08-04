import { QueryInterface } from 'sequelize';

// Vital edit history moves into the changelog. Edits made since the changelog trigger
// went live already have an entry for the same change, written in the same transaction
// as the vital log, so the pair share a created_at; those entries just lack the reason,
// which the old edit path failed to record. Everything older has no entry at all.
//
// So: enrich the existing entries with the vital log's reason, and synthesise entries
// only for vital logs older than their answer's first trigger-written entry. Synthesised
// entries reuse the vital log's id, so the copy a facility authors and the copy central
// authors from the same synced row dedupe on sync, and carry a sentinel device id (the
// authoring device was never recorded), which also makes the down self-contained.
// migration_context stays null on them so history views read them as operational.
//
// Their record_data is the answer's current row with body and updated_at overlaid, not
// a true point-in-time snapshot: only body is reconstructable from a vital log.
//
// Runs one statement over the whole table (~1M rows on the largest deployments); plan
// the upgrade window accordingly.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE logs.changes lc
    SET reason = vl.reason_for_change
    FROM vital_logs vl
    WHERE lc.table_name = 'survey_response_answers'
      AND lc.record_id = vl.answer_id
      AND lc.created_at = vl.created_at
      AND lc.reason IS NULL
      AND vl.reason_for_change IS NOT NULL
      AND vl.deleted_at IS NULL;
  `);

  await query.sequelize.query(`
    INSERT INTO logs.changes (
      id,
      table_oid,
      table_schema,
      table_name,
      logged_at,
      updated_by_user_id,
      record_id,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_data,
      reason,
      device_id,
      version
    )
    SELECT
      vl.id::uuid,
      'public.survey_response_answers'::regclass::oid,
      'public',
      'survey_response_answers',
      vl.created_at,
      COALESCE(vl.recorded_by_id, uuid_nil()::text),
      vl.answer_id,
      a.created_at,
      vl.created_at,
      a.deleted_at,
      to_jsonb(a.*) || jsonb_build_object('body', vl.new_value, 'updated_at', vl.created_at),
      vl.reason_for_change,
      'vital-log-migration',
      local_system_fact('currentVersion', 'unknown')
    FROM vital_logs vl
    JOIN survey_response_answers a ON a.id = vl.answer_id
    WHERE vl.deleted_at IS NULL
      AND vl.created_at < COALESCE((
        SELECT min(lc.created_at)
        FROM logs.changes lc
        WHERE lc.table_name = 'survey_response_answers'
          AND lc.record_id = vl.answer_id
          AND lc.device_id <> 'vital-log-migration'
      ), 'infinity')
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the reasons enriched onto trigger-written entries are kept; only the
  // synthesised entries go, identified by their sentinel device id since by now the
  // next migration's down has recreated vital_logs empty.
  await query.sequelize.query(`
    DELETE FROM logs.changes
    WHERE device_id = 'vital-log-migration';
  `);
}
