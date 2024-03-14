/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.insert(null, 'settings', {
    key: 'routineVaccine.ageLimit',
    value: 15,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.delete(null, 'settings', {
    comparator: {
      key: 'routineVaccine.ageLimit',
    },
  });
}
