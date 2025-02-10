import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('CREATE EXTENSION pgcrypto');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP EXTENSION pgcrypto');
}
