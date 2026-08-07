import { QueryInterface } from 'sequelize';

// Lab request status history moves into the changelog.
//
// Every status log was written in the same transaction as the status change itself, so for
// the audited era the changelog already holds the transition and the log row is a duplicate.
// Only history from before the changelog trigger went live needs entries synthesised, which
// is what the first-entry comparison below selects.
//
// Synthesised entries reuse the log's id, so the copy a facility authors and the copy central
// authors from the same synced row dedupe on sync, and carry a sentinel device id (the
// authoring device was never recorded), which also makes the down self-contained.
// migration_context stays null so status history reads them as operational entries.
//
// Their record_data is the request's current row with status and updated_at overlaid, not a
// point-in-time snapshot: only the status is reconstructable from a log row.
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
      device_id,
      version
    )
    SELECT
      l.id::uuid,
      'public.lab_requests'::regclass::oid,
      'public',
      'lab_requests',
      l.created_at,
      COALESCE(l.updated_by_id, uuid_nil()::text),
      l.lab_request_id,
      lr.created_at,
      l.created_at,
      lr.deleted_at,
      to_jsonb(lr.*) || jsonb_build_object('status', l.status, 'updated_at', l.created_at),
      'lab-request-log-migration',
      local_system_fact('currentVersion', 'unknown')
    FROM lab_request_logs l
    JOIN lab_requests lr ON lr.id = l.lab_request_id
    LEFT JOIN LATERAL (
      SELECT lc.created_at
      FROM logs.changes lc
      WHERE lc.table_name = 'lab_requests'
        AND lc.record_id = l.lab_request_id
        AND lc.device_id <> 'lab-request-log-migration'
      ORDER BY lc.created_at
      LIMIT 1
    ) first_entry ON true
    WHERE l.deleted_at IS NULL
      AND (first_entry.created_at IS NULL OR l.created_at < first_entry.created_at)
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: only the synthesised entries go, identified by their sentinel device id
  // since by now the next migration's down has recreated lab_request_logs empty.
  await query.sequelize.query(`
    DELETE FROM logs.changes
    WHERE device_id = 'lab-request-log-migration';
  `);
}
