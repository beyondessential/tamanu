/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.insert(null, 'settings', {
    key: 'vaccine.thresholds',
    value: JSON.stringify([
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
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.delete(null, 'settings', {
    comparator: {
      key: 'vaccine.thresholds',
    },
  });
}
