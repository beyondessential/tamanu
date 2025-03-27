import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('invoice_products', 'price', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('invoice_products', 'price', {
    type: DataTypes.DECIMAL,
    allowNull: false,
  });
}
