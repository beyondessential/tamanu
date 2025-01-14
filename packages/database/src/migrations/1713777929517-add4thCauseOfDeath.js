/** @typedef {import('sequelize').QueryInterface} QueryInterface */

import { INTEGER, STRING } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('patient_death_data', `antecedent_cause3_time_after_onset`, {
    type: INTEGER,
    allowNull: true,
    defaultValue: null,
  });
  await query.addColumn('patient_death_data', `antecedent_cause3_condition_id`, {
    type: STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('patient_death_data', `antecedent_cause3_condition_id`);
  await query.removeColumn('patient_death_data', `antecedent_cause3_time_after_onset`);
}
