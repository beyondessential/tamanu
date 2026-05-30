import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_price_lists', 'evaluation_order', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: drops the column, so any configured evaluation_order values are lost on rollback
  await query.removeColumn('invoice_price_lists', 'evaluation_order');
}
