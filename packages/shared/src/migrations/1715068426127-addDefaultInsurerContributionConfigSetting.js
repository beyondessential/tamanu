/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { SETTING_KEYS } from '@tamanu/constants';
import { Op } from 'sequelize';

const DEFAULT_SETTINGS = {
  [SETTING_KEYS.INSURER_DEFAUlT_CONTRIBUTION]: JSON.stringify(0.8),
};

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
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
  await query.bulkDelete('settings', {
    key: {
      [Op.in]: Object.keys(DEFAULT_SETTINGS),
    },
  });
}
