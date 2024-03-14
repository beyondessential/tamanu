/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import config from 'config';
import { Op } from 'sequelize';

const DEFAULT_SETTINGS = {
  'routineVaccine.thresholds': JSON.stringify([
    {
      threshold: 28,
      status: 'SCHEDULED',
    },
    {
      threshold: 7,
      status: 'UPCOMING',
    },
    {
      threshold: -7,
      status: 'DUE',
    },
    {
      threshold: -55,
      status: 'OVERDUE',
    },
    {
      threshold: '-Infinity',
      status: 'MISSED',
    },
  ]),
  'outineVaccine.ageLimit': '15',
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
  await query.bulkDelete('settings', {
    key: {
      [Op.in]: Object.entries(DEFAULT_SETTINGS).map(([key]) => key),
    },
  });
}
