/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  query.addColumn('invoice_item_discounts', 'type', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
  });
  query.renameColumn('invoice_item_discounts', 'percentage', 'amount');
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  query.removeColumn('invoice_item_discounts', 'type');
  query.renameColumn('invoice_item_discounts', 'amount', 'percentage');
}
