import { QueryInterface, QueryTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // we only need pgcrypto for postgres <13
  const rows = await query.sequelize.query(
    'SELECT setting FROM pg_settings WHERE name = $name LIMIT 1',
    { type: QueryTypes.SELECT, bind: { name: 'server_version_num' } },
  );

  if (((rows?.[0] as { [key: string]: any })?.setting ?? 0) < 130000) {
    await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  }
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP EXTENSION IF EXISTS pgcrypto');
}
