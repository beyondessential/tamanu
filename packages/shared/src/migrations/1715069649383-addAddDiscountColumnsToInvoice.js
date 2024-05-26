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

  const invoicePercentageChanges = await query.sequelize.query(
    'SELECT invoice_id, SUM(percentage_change) AS total_percentage_change FROM invoice_price_change_items WHERE deleted_at IS NULL AND status = :status GROUP BY invoice_id',
    { type: query.sequelize.QueryTypes.SELECT, replacements: { status: 'active' } },
  );

  for (const { invoice_id, total_percentage_change } of invoicePercentageChanges) {
    await query.sequelize.query(
      `UPDATE invoices SET discount_markup_percentage = :total_percentage_change WHERE id = :invoice_id;`,
      { replacements: { total_percentage_change, invoice_id } },
    );
  }
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoices', 'discount_markup_percentage');
  await query.removeColumn('invoices', 'discount_markup_reason');
}
