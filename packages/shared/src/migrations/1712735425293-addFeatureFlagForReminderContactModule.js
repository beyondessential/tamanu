/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { Op } from 'sequelize';
import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

const DEFAULT_SETTINGS = {
  'features.reminderContactModule.enabled': 'false',
};

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  //this setting only exists on the server
  const isFacilityServer = !!selectFacilityIds(config);
  if (isFacilityServer) return;

  await query.bulkInsert(
    'settings',
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value,
      facility_id: null,
    })),
  );
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  const isFacilityServer = !!selectFacilityIds(config);
  if (isFacilityServer) return;
  await query.bulkDelete('settings', {
    key: {
      [Op.in]: Object.keys(DEFAULT_SETTINGS),
    },
    facility_id: null,
  });
}
