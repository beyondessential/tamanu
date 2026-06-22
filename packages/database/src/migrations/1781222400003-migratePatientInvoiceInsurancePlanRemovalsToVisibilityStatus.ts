import { QueryInterface } from 'sequelize';

// Removing a plan from a patient used to soft-delete its patient_invoice_insurance_plans row.
// That is replaced by a visibility_status toggle (current <-> historical), so convert any existing
// soft-deleted rows into historical, undeleted rows. This is also required for correctness: the
// remove/re-add flow now reads rows with deleted_at IS NULL, so a leftover soft-deleted row would
// be invisible to it yet still occupy the (patient_id, invoice_insurance_plan_id) primary key,
// causing a collision when that plan is re-added.
//
// DML only (no DDL), so the ALTER-after-UPDATE pending-trigger-events problem does not apply.
//
// logs.changes: the UPDATE below is a normal row change, so the changelog trigger records the
// converted (now historical) rows automatically. The already-active rows are not touched by the
// UPDATE — they only received visibility_status = 'current' from the ADD COLUMN default in the
// previous migration, which is DDL and fires no trigger — so we append an entry for those ourselves.
// The two sets are disjoint (UPDATE hits deleted_at IS NOT NULL; the manual insert hits
// visibility_status = 'current'), so there are no duplicate entries.
//
// sync_lookup: the sync-tick trigger is dropped during migrations, so the UPDATE does not bump
// updated_at_sync_tick and the lookup refresh would not otherwise pick these rows up. Flag the model
// for a lookup rebuild, which regenerates its sync_lookup rows from the corrected data reusing each
// row's existing tick — so clients do not re-pull. No-op on facilities (no sync_lookup rows).
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE patient_invoice_insurance_plans
    SET visibility_status = 'historical',
        deleted_at = NULL
    WHERE deleted_at IS NOT NULL;

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
      'Active plan defaulted to visibility_status current when the column was added',
      get_session_config('audit.migration_context', NULL),
      pip.created_at,
      pip.updated_at,
      pip.deleted_at,
      to_jsonb(pip)
    FROM patient_invoice_insurance_plans pip
    WHERE pip.visibility_status = 'current';

    SELECT flag_lookup_model_to_rebuild('patient_invoice_insurance_plans');
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the original deleted_at timestamps are not preserved. Historical rows are
  // re-soft-deleted with the current timestamp to approximate the previous representation; the
  // changelog trigger records that change. The logs.changes entries appended by up() are left in
  // place (immutable log), and the lookup is rebuilt.
  await query.sequelize.query(`
    UPDATE patient_invoice_insurance_plans
    SET deleted_at = current_timestamp
    WHERE visibility_status = 'historical';

    SELECT flag_lookup_model_to_rebuild('patient_invoice_insurance_plans');
  `);
}
