import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('invoice_products', 'category', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('invoice_products', 'source_record_type', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('invoice_products', 'source_record_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addConstraint('invoice_products', {
    fields: ['source_record_id', 'source_record_type'],
    type: 'unique',
    name: 'invoice_products_source_record_id_source_record_type_unique',
  });

  await query.removeColumn('invoice_products', 'price');

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('invoice_products');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeConstraint(
    'invoice_products',
    'invoice_products_source_record_id_source_record_type_unique',
  );

  await query.removeColumn('invoice_products', 'source_record_type');
  await query.removeColumn('invoice_products', 'source_record_id');

  await query.addColumn('invoice_products', 'price', {
    type: DataTypes.DECIMAL,
    allowNull: false,
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('invoice_products');`);
}
