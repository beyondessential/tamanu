import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Remove the redundant `price` column from `invoice_products`.
 * Prices are now sourced from `invoice_price_list_items`.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_products', 'price');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_products', 'price', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
}
