import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_items', 'approved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('invoice_items');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_items', 'approved');
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('invoice_items');`);
}
