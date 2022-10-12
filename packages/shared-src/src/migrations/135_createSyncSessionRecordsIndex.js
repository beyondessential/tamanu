export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX sync_session_record_session_id_direction_index ON sync_session_records(session_id, direction);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX sync_session_record_session_id_direction_index;
  `);
}
