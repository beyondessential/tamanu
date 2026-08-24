import { QueryInterface } from 'sequelize';

// A patient merge can leave sync_lookup rows scoped to the merged-away patient when their scope is
// derived through other tables' joins (e.g. prescriptions via encounters), stopping those records
// from reaching any facility. flag_lookup_patient_to_rebuild queues a patient for the lookup build
// to re-derive every row still scoped to them; seeding it with all already-merged patients heals
// rows stranded by past merges on the first build after deploy.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION flag_lookup_patient_to_rebuild(patient_id text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO local_system_facts (key, value)
      VALUES ('lookupPatientsToRebuild', patient_id)
      ON CONFLICT (key) DO UPDATE SET value =
        CASE
        WHEN local_system_facts.value IS NULL OR local_system_facts.value = '' THEN
          patient_id
        WHEN patient_id = ANY(string_to_array(local_system_facts.value, ',')) THEN
          local_system_facts.value
        ELSE
          local_system_facts.value || ',' || patient_id
        END;
    END;
    $$;
  `);

  await query.sequelize.query(`
    INSERT INTO local_system_facts (key, value)
    SELECT 'lookupPatientsToRebuild', string_agg(id::text, ',')
    FROM patients
    WHERE merged_into_id IS NOT NULL
    HAVING count(*) > 0
    ON CONFLICT (key) DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS flag_lookup_patient_to_rebuild(text);`);
  await query.sequelize.query(`DELETE FROM local_system_facts WHERE key = 'lookupPatientsToRebuild';`);
}
