/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addIndex('invoices', ['encounter_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'invoices_encounter_id_unique',
  });

  await query.addIndex('invoice_discounts', ['invoice_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'invoice_discounts_invoice_id_unique',
  });

  await query.addIndex('invoice_item_discounts', ['invoice_item_id'], {
    where: { deleted_at: null },
    unique: true,
    name: 'invoice_item_discounts_invoice_item_id_unique',
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_items', 'product_code');

  await query.removeIndex('invoices', 'invoices_encounter_id_unique');

  await query.removeIndex('invoice_discounts', 'invoice_discounts_invoice_id_unique');

  await query.removeIndex(
    'invoice_item_discounts',
    'invoice_item_discounts_invoice_item_id_unique',
  );
}
