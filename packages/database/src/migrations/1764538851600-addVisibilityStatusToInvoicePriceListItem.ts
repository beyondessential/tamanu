import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_price_list_items', 'visibility_status', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'current',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_price_list_items', 'visibility_status');
}
