import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS encounter_history_encounter_id ON encounter_history (encounter_id)
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS encounter_history_encounter_id
  `);
}
