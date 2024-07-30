/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn('invoice_items', 'product_discountable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.sequelize.query(`
    UPDATE invoice_items
    SET product_name = ''
    WHERE product_name IS NULL
  `);
  await query.changeColumn('invoice_items', 'product_name', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  });
  await query.sequelize.query(`
    UPDATE invoice_items
    SET product_price = 0
    WHERE product_price IS NULL
  `);
  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  });
  await query.sequelize.query(`
    UPDATE invoice_items
    SET product_code = ''
    WHERE product_code IS NULL
  `);
  await query.changeColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  });
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn('invoice_items', 'product_discountable');
  await query.changeColumn('invoice_items', 'product_name', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.changeColumn('invoice_items', 'product_price', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.changeColumn('invoice_items', 'product_code', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
