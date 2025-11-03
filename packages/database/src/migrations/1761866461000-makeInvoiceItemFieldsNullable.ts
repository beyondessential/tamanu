import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.changeColumn('invoice_items', 'product_name', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.changeColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
}

export async function down(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: false,
  });

  await query.changeColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.changeColumn('invoice_items', 'product_name', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}
