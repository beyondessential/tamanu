/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.removeColumn('lab_tests', 'status');
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.addColumn('lab_tests', 'status', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
