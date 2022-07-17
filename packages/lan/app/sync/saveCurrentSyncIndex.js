export async function saveCurrentSyncIndex(sequelize, index) {
  await sequelize.query(`SELECT setval('sync_index_sequence', :index)`, {
    replacements: { index },
  });
}
