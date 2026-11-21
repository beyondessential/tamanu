import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS encounter_diets_encounter_id
    ON encounter_diets (encounter_id)
    WHERE deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS encounter_diets_encounter_id
  `);
}
