import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_items', 'source_record_type', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('invoice_items', 'source_record_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.removeColumn('invoice_items', 'source_id');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('invoice_items', 'source_record_type');
  await query.removeColumn('invoice_items', 'source_record_id');
  await query.addColumn('invoice_items', 'source_id', {
    type: DataTypes.UUID,
    allowNull: true,
  });
}
