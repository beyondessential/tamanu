import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE logs.changes
    SET record_data = jsonb_set(record_data, '{id}', to_jsonb(record_id::text))
    WHERE record_id != record_data->>'id';
  `);
}

export async function down(): Promise<void> {
  // Not possible to revert this migration
}
