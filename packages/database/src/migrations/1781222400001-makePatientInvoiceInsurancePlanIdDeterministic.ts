import { QueryInterface } from 'sequelize';

// Make the id deterministic from (patient_id, invoice_insurance_plan_id), same pattern as
// patient_facilities / patient_ongoing_prescriptions. REPLACE avoids collisions if ';'
// appears in a component id. The composite primary key gives each pair exactly one row for
// its whole lifecycle, so removing a plan soft-deletes that row and re-adding it restores
// the same row (rather than inserting a new record), and two facilities adding the same
// pair offline mint the same id and dedupe on sync instead of colliding.
//
// logs.changes and sync_lookup are remapped to the new ids (the preceding migration already
// removed their orphaned entries for the deduped rows). The transform is deterministic and
// runs on every server, so remapping without bumping the sync tick keeps central consistent
// with each facility's own migrated rows — no re-pull. The only DML is on those two tables,
// not on patient_invoice_insurance_plans itself, so adding/dropping columns on the table
// does not hit pending audit trigger events.

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX idx_patient_invoice_insurance_plans_patient_id_invoice_insurance_plan_id;

    ALTER TABLE patient_invoice_insurance_plans
      ADD COLUMN id_new TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("invoice_insurance_plan_id", ';', ':')) STORED;

    UPDATE logs.changes
    SET
      record_id = pip.id_new,
      record_data = jsonb_set(record_data, '{id}', to_jsonb(pip.id_new::text))
    FROM patient_invoice_insurance_plans pip
    WHERE logs.changes.record_id = pip.id::text
      AND logs.changes.table_name = 'patient_invoice_insurance_plans';

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
  // (the original uuids are unrecoverable). logs.changes / sync_lookup keep pointing at the
  // deterministic ids; re-running up recomputes the same deterministic id (a pure function of
  // patient_id + invoice_insurance_plan_id), which restores the linkage. Pure DDL with no DML
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
