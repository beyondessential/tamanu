/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('patient_additional_data', 'insurer_id', {
    type: DataTypes.STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
    allowNull: true,
  });
  await query.addColumn('patient_additional_data', 'insurer_policy_number', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('patient_additional_data', 'insurer_id');
  await query.removeColumn('patient_additional_data', 'insurer_policy_number');
}
