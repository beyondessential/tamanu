import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE patient_contacts ALTER COLUMN method DROP NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE patient_contacts ALTER COLUMN method SET NOT NULL;
  `);
}
