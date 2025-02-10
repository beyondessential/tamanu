import { QueryInterface, QueryTypes } from 'sequelize';


export async function up(query: QueryInterface): Promise<void> {
  // we only need pgcrypto for postgres <13
  const rows = await query.sequelize.query('show server_version_num', { type: QueryTypes.SELECT });
  if (((rows?.[0] as { [key: string]: any })?.server_version_num ?? 0) < 13000) {
    await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  }
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP EXTENSION IF EXISTS pgcrypto');
}
