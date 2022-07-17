export async function setSyncSessionSequence(sequelize, index) {
  await sequelize.query(`SELECT setval('sync_session_sequence', :index)`, {
    replacements: { index },
  });
}
