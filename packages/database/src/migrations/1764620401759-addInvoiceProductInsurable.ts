import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.removeColumn('invoice_products', 'discountable');
  await query.addColumn('invoice_products', 'insurable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('invoice_products', 'insurable');
  await query.addColumn('invoice_products', 'discountable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}
