import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_items', 'is_fixed_price_final', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_items', 'is_fixed_price_final');
}
