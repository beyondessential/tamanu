/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.changeColumn('invoice_products', 'discountable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.changeColumn('invoice_products', 'discountable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}
