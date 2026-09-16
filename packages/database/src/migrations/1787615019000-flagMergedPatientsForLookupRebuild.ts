import { QueryInterface } from 'sequelize';

// A merge can leave sync_lookup rows scoped to the merged-away patient when their scope derives
// through other tables' joins, stopping those records from reaching any facility.
// flag_lookup_patients_to_rebuild queues patients for the lookup build to re-derive every row
// still scoped to them. Takes the whole batch: re-parsing the list once per patient is quadratic.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION flag_lookup_patients_to_rebuild(patient_ids text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO local_system_facts (key, value)
      VALUES ('lookupPatientsToRebuild', '')
      ON CONFLICT (key) DO NOTHING;

      UPDATE local_system_facts
      SET value = (
        SELECT coalesce(string_agg(id, ',' ORDER BY first_seen), '')
        FROM (
          SELECT id, min(ord) AS first_seen
          FROM unnest(string_to_array(local_system_facts.value, ',') || patient_ids)
            WITH ORDINALITY AS t(id, ord)
          WHERE id <> ''
          GROUP BY id
        ) ids
      )
      WHERE key = 'lookupPatientsToRebuild';
    END;
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS flag_lookup_patients_to_rebuild(text[]);`);
}
