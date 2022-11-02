export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX session_sync_record_session_id_direction_index ON session_sync_records(session_id, direction);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX session_sync_record_session_index_direction_index;
  `);
}
