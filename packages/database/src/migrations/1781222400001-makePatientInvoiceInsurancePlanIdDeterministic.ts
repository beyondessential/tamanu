import { QueryInterface } from 'sequelize';

// Make the id deterministic from (patient_id, invoice_insurance_plan_id), same pattern as
// patient_facilities / patient_ongoing_prescriptions. REPLACE avoids collisions if ';'
// appears in a component id. The composite primary key gives each pair exactly one row for
// its whole lifecycle, so removing a plan soft-deletes that row and re-adding it restores
// the same row (rather than inserting a new record), and two facilities adding the same
// pair offline mint the same id and dedupe on sync instead of colliding.
//
// logs.changes is an immutable audit log: we never UPDATE its rows to "follow" the id change.
// Re-keying a record is recorded as a delete + create pair, leaving the existing history alone:
//   1. a tombstone keyed by the old random id with record_deleted_at set, marking that the
//      old-id record was hard-deleted by this migration (same shape as the dedupe tombstones).
//      It is written before id_new is added so its record_data is the pristine original row.
//   2. a fresh entry keyed by the new deterministic id holding the record's current state, so the
//      record's life continues under the new id.
// record_data is built from the live row; migration_context (which migration/direction/server) is
// filled automatically by the migration runner and read back the same way logs.record_change()
// does; reason is the human-readable WHY (the create entry names the old id so the halves link).
//
// sync_lookup is a derived cache (not an audit log), so its rows are remapped to the new ids in
// place. The transform is deterministic and runs on every server, so remapping without bumping
// the sync tick keeps central consistent with each facility's own migrated rows — no re-pull.
// All DML targets logs.changes and sync_lookup, not patient_invoice_insurance_plans itself, so
// adding/dropping columns on the table does not hit pending audit trigger events.

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX idx_patient_invoice_insurance_plans_patient_id_invoice_insurance_plan_id;

    -- 1. Tombstone the old random UUID id before re-keying: the record under that id no longer exists
    --    afterwards, and record_data captures the pristine original row (no id_new column yet).
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
      pip.id,
      local_system_fact('deviceId', 'unknown'),
      local_system_fact('currentVersion', 'unknown'),
      'id made deterministic from (patient_id, invoice_insurance_plan_id); this record under its former random id was replaced by its new deterministic id',
      get_session_config('audit.migration_context', NULL),
      pip.created_at,
      pip.updated_at,
      current_timestamp,
      to_jsonb(pip)
    FROM patient_invoice_insurance_plans pip;

    ALTER TABLE patient_invoice_insurance_plans
      ADD COLUMN id_new TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("invoice_insurance_plan_id", ';', ':')) STORED;

    -- 2. Create the record under the new deterministic id, carrying its current state.
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
      pip.id_new,
      local_system_fact('deviceId', 'unknown'),
      local_system_fact('currentVersion', 'unknown'),
      'id made deterministic from (patient_id, invoice_insurance_plan_id); continues former random id ' || pip.id,
      get_session_config('audit.migration_context', NULL),
      pip.created_at,
      pip.updated_at,
      pip.deleted_at,
      jsonb_set(to_jsonb(pip) - 'id_new', '{id}', to_jsonb(pip.id_new))
    FROM patient_invoice_insurance_plans pip;

    UPDATE sync_lookup
    SET
      record_id = pip.id_new,
      data = jsonb_set(data::jsonb, '{id}', to_jsonb(pip.id_new))
    FROM patient_invoice_insurance_plans pip
    WHERE sync_lookup.record_id = pip.id::text
      AND sync_lookup.record_type = 'patient_invoice_insurance_plans';

    ALTER TABLE patient_invoice_insurance_plans DROP CONSTRAINT patient_invoice_insurance_plans_pkey;
    ALTER TABLE patient_invoice_insurance_plans DROP COLUMN id;
    ALTER TABLE patient_invoice_insurance_plans RENAME COLUMN id_new TO id;
    ALTER TABLE patient_invoice_insurance_plans ADD CONSTRAINT patient_invoice_insurance_plans_id_key UNIQUE (id);
    ALTER TABLE patient_invoice_insurance_plans ALTER COLUMN id SET NOT NULL;
    ALTER TABLE patient_invoice_insurance_plans ADD PRIMARY KEY (patient_id, invoice_insurance_plan_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the deterministic ids are dropped and existing rows get fresh random uuids
  // (the original uuids are unrecoverable). The delete/create audit entries appended to
  // logs.changes in up() are left in place — it is an immutable log. sync_lookup keeps pointing
  // at the deterministic ids; re-running up recomputes the same deterministic id (a pure function
  // of patient_id + invoice_insurance_plan_id), which restores the linkage. Pure DDL with no DML
  // on the table, and no DROP EXPRESSION (which requires Postgres 13+).
  await query.sequelize.query(`
    ALTER TABLE patient_invoice_insurance_plans DROP CONSTRAINT patient_invoice_insurance_plans_pkey;
    ALTER TABLE patient_invoice_insurance_plans DROP CONSTRAINT patient_invoice_insurance_plans_id_key;
    ALTER TABLE patient_invoice_insurance_plans DROP COLUMN id;
    ALTER TABLE patient_invoice_insurance_plans ADD COLUMN id TEXT NOT NULL DEFAULT gen_random_uuid()::text;
    ALTER TABLE patient_invoice_insurance_plans ADD PRIMARY KEY (id);

    CREATE UNIQUE INDEX idx_patient_invoice_insurance_plans_patient_id_invoice_insurance_plan_id
    ON patient_invoice_insurance_plans (patient_id, invoice_insurance_plan_id)
    WHERE deleted_at IS NULL;
  `);
}
