// NOTE ABOUT IMPORTING CONFIG IN THIS MIGRATION
// Generally you shouldn't import things into migrations, because then you rely on that import
// keeping a stable API
// We import config here in a departure from that rule of thumb, but please don't copy blindly:
// - It's probably not okay to use config if the schema is altered (not the case here, only data)
// - Consider the case when the config you're using were to go missing - would this be ok for the
//   migration? (here, a missing serverFacilityId is just a no-op)
import config from 'config';

const LAST_SUCCESSFUL_SYNC_PULL = 'lastSuccessfulSyncPull';

export async function up(query) {
  const { serverFacilityId } = config;
  if (!serverFacilityId) {
    return; // probably a central server, this migration is not required
  }

  const [rows] = await query.sequelize.query(`
    SELECT COUNT(*) as count from patients
  `);

  // Insert default lastSuccessfulSyncPull = 0
  // if the server already has synced data and is being upgraded
  if (rows[0]?.count && parseInt(rows[0]?.count, 10)) {
    await query.sequelize.query(`
      INSERT INTO local_system_facts (id, created_at, updated_at, key, value)
      VALUES (uuid_generate_v4(), NOW(), NOW(), '${LAST_SUCCESSFUL_SYNC_PULL}', 0)
    `);
  }
}

export async function down(query) {
  const { serverFacilityId } = config;
  if (!serverFacilityId) {
    return; // probably a central server, this migration is not required
  }

  await query.sequelize.query(`
    DELETE FROM local_system_facts
    WHERE key = '${LAST_SUCCESSFUL_SYNC_PULL}'
  `);
}
