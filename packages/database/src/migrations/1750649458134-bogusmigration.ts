import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`SELECT 1`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`SELECT 1`);
}
