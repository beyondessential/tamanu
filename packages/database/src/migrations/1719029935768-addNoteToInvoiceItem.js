/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_items', 'note', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_items', 'note');
}
