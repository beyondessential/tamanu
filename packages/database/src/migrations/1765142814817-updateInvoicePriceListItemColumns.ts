import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_price_list_items', 'visibility_status');
  await query.addColumn('invoice_price_list_items', 'is_hidden', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_price_list_items', 'visibility_status', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'current',
  });
  await query.removeColumn('invoice_price_list_items', 'is_hidden');
}
