/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoices', 'patient_payment_status', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unpaid',
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoices', 'patient_payment_status');
}
