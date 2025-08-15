import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE patients SET middle_name = 'test' WHERE id = (SELECT id FROM patients WHERE middle_name IS NULL ORDER BY id LIMIT 1);
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE patients SET middle_name = NULL WHERE id = (SELECT id FROM patients WHERE middle_name = 'test' ORDER BY id LIMIT 1);
  `);
}
