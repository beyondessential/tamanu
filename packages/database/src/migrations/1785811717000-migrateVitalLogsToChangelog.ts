import { QueryInterface } from 'sequelize';

// Each vital log becomes a changelog entry for its answer, carrying the original
// change's provenance: entries reuse the vital log's id, so the copy a facility
// authored and the copy central authored from the same synced row dedupe on sync.
// migration_context stays null so history views read them as operational entries.
export async function up(query: QueryInterface): Promise<void> {
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
      local_system_fact('deviceId', 'unknown'),
      local_system_fact('currentVersion', 'unknown')
    FROM vital_logs vl
    JOIN survey_response_answers a ON a.id = vl.answer_id
    WHERE vl.deleted_at IS NULL
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM logs.changes lc
    USING vital_logs vl
    WHERE lc.id = vl.id::uuid;
  `);
}
