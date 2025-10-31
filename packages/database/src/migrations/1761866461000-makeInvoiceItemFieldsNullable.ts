import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.sequelize.query(`ALTER TABLE invoice_items ALTER COLUMN product_price DROP DEFAULT;`);

  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
}

export async function down(query: QueryInterface, _sequelize: typeof Sequelize) {
  await query.sequelize.query(
    `UPDATE invoice_items SET product_price = 0 WHERE product_price IS NULL;`,
  );

  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  });
}
