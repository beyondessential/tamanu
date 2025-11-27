import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.renameColumn('invoice_items', 'product_name', 'product_name_final');
  await query.renameColumn('invoice_items', 'product_code', 'product_code_final');
  await query.renameColumn('invoice_items', 'product_price', 'manual_entry_price');
  await query.addColumn('invoice_items', 'price_final', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.removeColumn('invoice_items', 'product_discountable');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_items', 'price_final');
  await query.renameColumn('invoice_items', 'manual_entry_price', 'product_price');
  await query.renameColumn('invoice_items', 'product_code_final', 'product_code');
  await query.renameColumn('invoice_items', 'product_name_final', 'product_name');
  await query.addColumn('invoice_items', 'product_discountable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}
