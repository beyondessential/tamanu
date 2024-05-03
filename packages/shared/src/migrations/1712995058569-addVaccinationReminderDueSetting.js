/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import config from 'config';
import { Op } from 'sequelize';

const DEFAULT_SETTINGS = {
  'vaccinationReminder.due': JSON.stringify([7, 1, -7]),
};

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  if (config?.serverFacilityId) return;
  await query.bulkInsert(
    'settings',
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key,
      value,
    })),
  );
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  if (config?.serverFacilityId) return;
  await query.bulkDelete('settings', {
    key: {
      [Op.in]: Object.keys(DEFAULT_SETTINGS),
    },
  });
}
