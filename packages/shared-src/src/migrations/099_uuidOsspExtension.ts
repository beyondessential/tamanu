import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
}

export async function down(query: QueryInterface) {
  await query.sequelize.query('DROP EXTENSION "uuid-ossp";');
}
