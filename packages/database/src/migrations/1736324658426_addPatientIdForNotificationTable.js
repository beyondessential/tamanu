/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('notifications', 'patient_id', {
    type: DataTypes.STRING,
    references: {
      model: 'patients',
      key: 'id',
    },
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('notifications', 'patient_id');
}
