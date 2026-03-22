import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `UPDATE reference_data 
     SET 
      deleted_at = NOW(),
      visibility_status = 'historical'
    WHERE type = 'additionalInvoiceProduct';`,
  );

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('reference_data');`);
}

export async function down(): Promise<void> {
  // Can't really do a reliable down migration as we don't know what was previously not deleted
}
