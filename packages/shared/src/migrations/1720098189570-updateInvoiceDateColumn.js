/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.changeColumn('invoices', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.changeColumn('invoices', 'date', {
    type: DataTypes.DATESTRING,
    allowNull: false,
  });
}
