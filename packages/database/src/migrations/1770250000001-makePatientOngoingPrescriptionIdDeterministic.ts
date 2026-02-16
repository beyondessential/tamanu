import { QueryInterface, QueryTypes } from 'sequelize';

// Deterministic id from (patient_id, prescription_id), same pattern as patient_facilities.
// REPLACE avoids collisions if ';' appears in ids. Updates logs.changes and sync_lookup so audit and sync stay consistent.

export async function up(query: QueryInterface): Promise<void> {
  const duplicates = await query.sequelize.query<{
    patient_id: string;
    prescription_id: string;
    count: string;
  }>(
    `
    SELECT patient_id, prescription_id, COUNT(*)::text as count
    FROM patient_ongoing_prescriptions
    GROUP BY patient_id, prescription_id
    HAVING COUNT(*) > 1
    `,
    { type: QueryTypes.SELECT },
  );

  if (duplicates.length > 0) {
    throw new Error(
      `Cannot run migration: found ${duplicates.length} duplicate (patient_id, prescription_id) pair(s) in patient_ongoing_prescriptions. ` +
        `Clean up duplicates manually before running this migration. Duplicates: ${JSON.stringify(duplicates)}`,
    );
  }

  await query.sequelize.query(`
    ALTER TABLE patient_ongoing_prescriptions
      ADD COLUMN id_new TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("prescription_id", ';', ':')) STORED;

    UPDATE logs.changes
    SET record_id = pop.id_new
    FROM patient_ongoing_prescriptions pop
    WHERE logs.changes.record_id = pop.id::text
      AND logs.changes.table_name = 'patient_ongoing_prescriptions';

    UPDATE logs.changes
    SET record_data = jsonb_set(record_data, '{id}', to_jsonb(record_id::text))
    WHERE table_name = 'patient_ongoing_prescriptions'
      AND record_id != record_data->>'id';

    UPDATE sync_lookup
    SET record_id = pop.id_new
    FROM patient_ongoing_prescriptions pop
    WHERE sync_lookup.record_id = pop.id::text
      AND sync_lookup.record_type = 'patient_ongoing_prescriptions';

    UPDATE sync_lookup
    SET data = jsonb_set(data::jsonb, '{id}', to_jsonb(record_id))
    WHERE record_type = 'patient_ongoing_prescriptions'
      AND (data::jsonb->>'id') IS DISTINCT FROM record_id;

    ALTER TABLE patient_ongoing_prescriptions DROP CONSTRAINT patient_ongoing_prescriptions_pkey;
    ALTER TABLE patient_ongoing_prescriptions DROP COLUMN id;
    ALTER TABLE patient_ongoing_prescriptions RENAME COLUMN id_new TO id;
    ALTER TABLE patient_ongoing_prescriptions ADD CONSTRAINT patient_ongoing_prescriptions_id_key UNIQUE (id);
    ALTER TABLE patient_ongoing_prescriptions ALTER COLUMN id SET NOT NULL;
    ALTER TABLE patient_ongoing_prescriptions ADD PRIMARY KEY (patient_id, prescription_id);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: Cannot restore original UUID ids or logs.changes record_id values
  await query.sequelize.query(`
    ALTER TABLE patient_ongoing_prescriptions DROP CONSTRAINT patient_ongoing_prescriptions_pkey;
    ALTER TABLE patient_ongoing_prescriptions ADD COLUMN id_old UUID DEFAULT gen_random_uuid();
    UPDATE patient_ongoing_prescriptions SET id_old = gen_random_uuid();
    ALTER TABLE patient_ongoing_prescriptions DROP COLUMN id;
    ALTER TABLE patient_ongoing_prescriptions RENAME COLUMN id_old TO id;
    ALTER TABLE patient_ongoing_prescriptions ADD PRIMARY KEY (id);
  `);
}
