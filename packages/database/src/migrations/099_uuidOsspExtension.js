export async function up(query) {
  await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
}

export async function down(query) {
  await query.sequelize.query('DROP EXTENSION "uuid-ossp";');
}
