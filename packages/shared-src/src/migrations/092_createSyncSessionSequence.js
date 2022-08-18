export async function up(query) {
  await query.sequelize.query(`CREATE SEQUENCE sync_session_sequence`);
}

export async function down(query) {
  await query.sequelize.query('DROP SEQUENCE sync_session_sequence');
}
