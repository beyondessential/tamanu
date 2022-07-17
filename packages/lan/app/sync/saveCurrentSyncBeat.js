export async function saveCurrentSyncBeat(sequelize, beat) {
  await sequelize.query(`SELECT setval('sync_beat_sequence', :beat)`, { replacements: { beat } });
}
