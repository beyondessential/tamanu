import config from 'config';
import { generateId } from 'shared/utils/generateId';

const SETTING_KEY = 'sync.syncAllLabRequests';

module.exports = {
  up: async query => {
    const { serverFacilityId, sync } = config;
    if (!serverFacilityId) {
      return; // probably a central server, this migration is not required
    }
    const now = new Date();
    await query.bulkInsert('settings', [
      {
        id: generateId(),
        key: SETTING_KEY,
        value: !!sync.syncAllLabRequests,
        facility_id: serverFacilityId,
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  down: async query => {
    const { serverFacilityId } = config;
    if (!serverFacilityId) {
      return; // probably a central server, this migration is not required
    }
    await query.bulkDelete('settings', { key: SETTING_KEY, facility_id: serverFacilityId });
  },
};
