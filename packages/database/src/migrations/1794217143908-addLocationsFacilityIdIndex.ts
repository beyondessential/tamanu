import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS locations_facility_id
    ON locations (facility_id)
    WHERE deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS locations_facility_id
  `);
}
