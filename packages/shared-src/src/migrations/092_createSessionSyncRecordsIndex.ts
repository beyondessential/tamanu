import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE INDEX session_sync_record_session_index_direction_index ON session_sync_records(session_index, direction);
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    DROP INDEX session_sync_record_session_index_direction_index;
  `);
}
