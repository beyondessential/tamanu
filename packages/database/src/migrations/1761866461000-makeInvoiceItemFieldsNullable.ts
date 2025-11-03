import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.renameColumn('invoice_items', 'product_name', 'product_name_final');
  await query.renameColumn('invoice_items', 'product_code', 'product_code_final');
  await query.renameColumn('invoice_items', 'product_price', 'product_price_final');

  await query.changeColumn('invoice_items', 'product_name_final', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.changeColumn('invoice_items', 'product_code_final', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.changeColumn('invoice_items', 'product_price_final', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
}

export async function down(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.changeColumn('invoice_items', 'product_price_final', {
    type: DataTypes.DECIMAL,
    allowNull: false,
  });

  await query.changeColumn('invoice_items', 'product_code_final', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.changeColumn('invoice_items', 'product_name_final', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.renameColumn('invoice_items', 'product_price_final', 'product_price');
  await query.renameColumn('invoice_items', 'product_code_final', 'product_code');
  await query.renameColumn('invoice_items', 'product_name_final', 'product_name');
}
