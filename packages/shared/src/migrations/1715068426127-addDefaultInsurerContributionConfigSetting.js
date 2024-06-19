/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import config from 'config';
import { Op } from 'sequelize';

const DEFAULT_SETTINGS = {
  'insurer.defaultContribution': JSON.stringify(0.8),
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
