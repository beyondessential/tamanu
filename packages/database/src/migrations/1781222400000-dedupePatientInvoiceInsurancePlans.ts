import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // The next migration makes the id deterministic and the primary key composite on
  // (patient_id, invoice_insurance_plan_id), so each pair must have exactly one row first.
  // The released insert-new-on-re-add behaviour can leave a live row plus soft-deleted
  // tombstones for the same pair. Keep the live row if one exists, otherwise the
  // soft-deleted row with the highest id (deterministic across servers since ids are synced).
  //
  // For each row we hard-delete we write a deletion-tombstone row into logs.changes rather
  // than deleting that record's audit history. logs.changes is an immutable audit log, so we
  // never remove from it; instead we append a final entry whose record_deleted_at marks that
  // the source record no longer exists, with record_data carrying its last known snapshot. The
  // two annotation columns answer different questions:
  //   - migration_context: WHICH migration made the change (direction/name/serverType). It is
  //     set automatically by the migration runner as a session var, so we read it back with
  //     get_session_config — exactly as the logs.record_change() trigger does for normal writes.
  //   - reason: the human-readable WHY, which we fill in explicitly below.
  //
  // sync_lookup is a derived cache (not an audit log), so its rows for the deleted ids are
  // removed by record_id: neither sync_lookup nor logs.changes is usefully indexed on its type
  // column (sync_lookup is unique on (record_id, record_type)), so driving the delete off the
  // small set of just-deleted ids stays index-assisted and avoids a sequential scan of millions
  // of rows. Surviving rows' sync_lookup entries are remapped to the new ids in the next
  // migration, so no rebuild/re-pull is needed — and on facilities (no sync_lookup rows) it is a
  // no-op.
  await query.sequelize.query(`
    WITH deleted_duplicates AS (
      DELETE FROM patient_invoice_insurance_plans
      WHERE id NOT IN (
        SELECT DISTINCT ON (patient_id, invoice_insurance_plan_id) id
        FROM patient_invoice_insurance_plans
        ORDER BY patient_id, invoice_insurance_plan_id, (deleted_at IS NULL) DESC, id DESC
      )
      RETURNING *
    ),
    cleared_sync_lookup AS (
      DELETE FROM sync_lookup
      WHERE record_id IN (SELECT id FROM deleted_duplicates)
        AND record_type = 'patient_invoice_insurance_plans'
    )

    -- Tombstone the logs.changes of duplicated PIIP
    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      updated_by_user_id,
      record_id,
      device_id,
      version,
      reason,
      migration_context,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_data
    )
    SELECT
      'patient_invoice_insurance_plans'::regclass::oid,
      'public',
      'patient_invoice_insurance_plans',
      get_session_config('audit.userid', uuid_nil()::text),
      d.id,
      local_system_fact('deviceId', 'unknown'),
      local_system_fact('currentVersion', 'unknown'),
      'Hard-deleted as a duplicate (patient_id, invoice_insurance_plan_id) pair so the next migration can make the id deterministic and the primary key composite. The surviving row for the pair is kept.',
      get_session_config('audit.migration_context', NULL),
      d.created_at,
      d.updated_at,
      current_timestamp,
      to_jsonb(d.*)
    FROM deleted_duplicates d;
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the duplicate rows cannot be restored. The deletion-tombstone entries written
  // to logs.changes are intentionally left in place — it is an immutable audit log.
}
