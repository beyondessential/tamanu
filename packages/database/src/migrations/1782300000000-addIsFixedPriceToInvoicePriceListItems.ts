import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_price_list_items', 'is_fixed_price', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.sequelize.query(`
    ALTER TABLE invoice_price_list_items
    ADD CONSTRAINT invoice_price_list_items_hidden_fixed_exclusive
    CHECK (NOT (is_hidden AND is_fixed_price))
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE invoice_price_list_items
    DROP CONSTRAINT IF EXISTS invoice_price_list_items_hidden_fixed_exclusive
  `);
  await query.removeColumn('invoice_price_list_items', 'is_fixed_price');
}
