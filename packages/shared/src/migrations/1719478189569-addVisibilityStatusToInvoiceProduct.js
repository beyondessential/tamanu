/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_products', 'visibility_status', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'current',
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_products', 'visibility_status');
}
