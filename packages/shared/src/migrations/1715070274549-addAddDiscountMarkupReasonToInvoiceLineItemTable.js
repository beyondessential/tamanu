/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_line_items', 'discount_markup_reason', {
    type: DataTypes.STRING,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_line_items', 'discount_markup_reason');
}
