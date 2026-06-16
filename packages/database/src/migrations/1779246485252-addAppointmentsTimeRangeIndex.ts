import { type QueryInterface } from 'sequelize';

const INDEX_NAME = 'idx_appointments_location_group_start_time';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX ${INDEX_NAME}
    ON appointments (location_group_id, start_time)
    WHERE deleted_at IS NULL AND status <> 'Cancelled';
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX IF EXISTS ${INDEX_NAME};`);
}
