// NOTE ABOUT IMPORTING CONFIG IN THIS MIGRATION
// Generally you shouldn't import things into migrations, because then you rely on that import
// keeping a stable API
// We import config here in a departure from that rule of thumb, but please don't copy blindly:
// - It's probably not okay to use config if the schema is altered (not the case here, only data)
// - Consider the case when the config you're using were to go missing - would this be ok for the
//   migration? (here, a missing serverFacilityId is just a no-op)
import config from 'config';
// End of antipattern

const SETTING_KEY = 'sync.syncAllLabRequests';

module.exports = {
  up: async query => {
    const { serverFacilityId, sync } = config;
    if (!serverFacilityId) {
      return; // probably a central server, this migration is not required
    }
    await query.sequelize.query(`
      INSERT INTO settings
        (id, key, value, facility_id, created_at, updated_at)
      VALUES
        (uuid_generate_v4(), '${SETTING_KEY}', ${!!sync?.syncAllLabRequests}, '${serverFacilityId}', NOW(), NOW());
    `);
  },
  down: async query => {
    const { serverFacilityId } = config;
    if (!serverFacilityId) {
      return; // probably a central server, this migration is not required
    }
    await query.bulkDelete('settings', { key: SETTING_KEY, facility_id: serverFacilityId });
  },
};
