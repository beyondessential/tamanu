import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS permissions_role_id ON permissions (role_id) WHERE deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS permissions_role_id
  `);
}
