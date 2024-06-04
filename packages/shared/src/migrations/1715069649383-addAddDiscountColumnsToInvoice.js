/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoices', 'discount_markup_percentage', {
    type: DataTypes.DECIMAL,
  });
  await query.addColumn('invoices', 'discount_markup_reason', {
    type: DataTypes.STRING,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoices', 'discount_markup_percentage');
  await query.removeColumn('invoices', 'discount_markup_reason');
}
