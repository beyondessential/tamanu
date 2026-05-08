/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { INVOICE_PATIENT_PAYMENT_STATUSES } from '@tamanu/constants';
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoices', 'patient_payment_status', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID,
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoices', 'patient_payment_status');
}
