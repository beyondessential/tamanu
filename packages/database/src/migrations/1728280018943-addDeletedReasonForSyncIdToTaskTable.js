/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('tasks', 'deleted_reason_for_sync_id', {
    type: DataTypes.STRING,
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
  await query.removeColumn('tasks', 'deleted_reason_for_sync_id');
}
