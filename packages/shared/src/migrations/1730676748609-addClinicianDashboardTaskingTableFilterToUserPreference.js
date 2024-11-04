/* eslint-disable no-unused-vars */
/** @typedef {import('sequelize').QueryInterface} QueryInterface */

import { DataTypes } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('user_preferences', 'clinician_dashboard_tasking_table_filter', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('user_preferences', 'clinician_dashboard_tasking_table_filter');
}
