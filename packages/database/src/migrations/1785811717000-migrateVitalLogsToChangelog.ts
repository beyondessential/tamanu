import { QueryInterface } from 'sequelize';

// Vital edit history moves into the changelog.
//
// Edits made since the changelog trigger went live already have an entry for the same
// change, minus the reason, which the old edit path failed to record. The pair can't be
// matched on equal timestamps: the trigger stamps entries with transaction-start time
// while Sequelize stamped vital logs from the JS clock, seconds later (live data shows
// 4-15s of skew, the transaction duration). So the reasons are restored by matching on
// record + same body + nearest preceding entry within a window, and entries are
// synthesised only for vital logs older than their answer's first trigger-written entry.
//
// Synthesised entries reuse the vital log's id, so the copy a facility authors and the
// copy central authors from the same synced row dedupe on sync, and carry a sentinel
// device id (the authoring device was never recorded), which also makes the down
// self-contained. migration_context stays null so history views read them as
// operational. Their record_data is the answer's current row with body and updated_at
// overlaid, not a point-in-time snapshot: only body is reconstructable from a vital log.
//
// Only answers that were actually edited get entries synthesised: a lone initial
// recording carries no history, and the tables read a single entry the same as none.
// That keeps this to thousands of inserts rather than one per vital ever recorded.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE logs.changes lc
    SET reason = matched.reason_for_change
    FROM (
      SELECT DISTINCT ON (vl.id)
        vl.reason_for_change,
        candidate.id AS entry_id
      FROM vital_logs vl
      JOIN logs.changes candidate
        ON  candidate.table_name = 'survey_response_answers'
        AND candidate.record_id = vl.answer_id
        AND candidate.reason IS NULL
        AND candidate.record_data->>'body' = vl.new_value
        AND candidate.created_at BETWEEN vl.created_at - interval '30 minutes' AND vl.created_at
      WHERE vl.deleted_at IS NULL
        AND vl.reason_for_change IS NOT NULL
      ORDER BY vl.id, candidate.created_at DESC
    ) matched
    WHERE lc.id = matched.entry_id;
  `);

  await query.sequelize.query(`
    WITH edited_answers AS (
      SELECT answer_id
      FROM vital_logs
      WHERE deleted_at IS NULL
      GROUP BY answer_id
      HAVING count(*) > 1 OR count(previous_value) > 0
    )
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
    JOIN edited_answers ON edited_answers.answer_id = vl.answer_id
    JOIN survey_response_answers a ON a.id = vl.answer_id
    LEFT JOIN LATERAL (
      SELECT lc.created_at, lc.record_data->>'body' AS body
      FROM logs.changes lc
      WHERE lc.table_name = 'survey_response_answers'
        AND lc.record_id = vl.answer_id
        AND lc.device_id <> 'vital-log-migration'
      ORDER BY lc.created_at
      LIMIT 1
    ) first_entry ON true
    WHERE vl.deleted_at IS NULL
      AND (first_entry.created_at IS NULL OR vl.created_at < first_entry.created_at)
      -- a mobile-recorded initial log and the entry central authored at persist time
      -- describe the same recording; skip on matching body
      AND (first_entry.body IS NULL OR vl.previous_value IS NOT NULL OR first_entry.body <> vl.new_value)
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the reasons restored onto trigger-written entries are kept; only the
  // synthesised entries go, identified by their sentinel device id since by now the
  // next migration's down has recreated vital_logs empty.
  await query.sequelize.query(`
    DELETE FROM logs.changes
    WHERE device_id = 'vital-log-migration';
  `);
}
