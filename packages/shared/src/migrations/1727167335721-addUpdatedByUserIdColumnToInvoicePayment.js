/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_payments', 'updated_by_user_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_payments', 'updated_by_user_id');
}
