/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { Op } from 'sequelize';
import config from 'config';

const DEFAULT_SETTINGS = {
  'invoice.slidingFeeScale': JSON.stringify([
    [0, 5700, 10050, 12600, 14100, 17500],
    [0, 6600, 13500, 16300, 19000, 21800],
    [0, 7400, 17000, 20500, 23900, 27500],
    [0, 8500, 20600, 24800, 28900, 32500],
    [0, 9700, 24200, 29000, 33800, 38700],
    [0, 10700, 27700, 33200, 37500, 43000],
    [0, 11500, 31200, 37400, 43700, 46000],
    [0, 12600, 34700, 41600, 48600, 55600],
    [0, 14800, 38300, 45900, 53600, 65000],
    [0, 16600, 41800, 50200, 58500, 70000],
    [0, 18900, 45300, 54400, 63400, 75000],
    [0, 23500, 48800, 58600, 68400, 85000],
  ]),
};

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  if (config.serverFacilityId) return;
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
  if (config.serverFacilityId) return;
  await query.bulkDelete('settings', {
    key: {
      [Op.in]: Object.keys(DEFAULT_SETTINGS),
    },
  });
}
