import { QueryInterface } from 'sequelize';

// Seeds the lookup rebuild flag with every already-merged patient, so rows stranded by past
// merges heal on the first lookup build after deploy.
export async function up(query: QueryInterface): Promise<void> {
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
  await query.sequelize.query(`DELETE FROM local_system_facts WHERE key = 'lookupPatientsToRebuild';`);
}
