import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addIndex('invoice_items', ['invoice_id', 'source_record_type', 'source_record_id'], {
    unique: true,
    name: 'invoice_items_invoice_id_source_record_type_source_record_id_unique',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(
    'invoice_items',
    'invoice_items_invoice_id_source_record_type_source_record_id_unique',
  );
}
