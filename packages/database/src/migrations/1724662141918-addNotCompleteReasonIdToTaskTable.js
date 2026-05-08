/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.renameColumn('tasks', 'not_completed_note', 'not_completed_reason_id');
  await query.sequelize.query(`UPDATE tasks SET not_completed_reason_id = NULL`);
  await query.changeColumn('tasks', 'not_completed_reason_id', {
    type: DataTypes.TEXT,
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
  await query.changeColumn('tasks', 'not_completed_reason_id', {
    type: DataTypes.TEXT,
    allowNull: true,
    references: undefined,
  });
  await query.renameColumn('tasks', 'not_completed_reason_id', 'not_completed_note');
}
