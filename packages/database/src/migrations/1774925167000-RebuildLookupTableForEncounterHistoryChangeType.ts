import { type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Rebuild sync_lookup for encounter_history after change_type column was changed
  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('encounter_history');
  `);
}

export async function down(): Promise<void> {
  // No reverse migration
}
