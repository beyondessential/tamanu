import { QueryInterface } from 'sequelize';

// In 1739168538058-pgcryptoExtension, pgcrypto was added to pg<=12, only for
// gen_random_uuid. In this migration, we add it everywhere for gen_random_bytes

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP EXTENSION IF EXISTS pgcrypto');
}
