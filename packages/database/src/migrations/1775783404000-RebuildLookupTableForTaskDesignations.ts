import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM sync_lookup
    WHERE record_type = 'task_designations';
  `);

  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('task_designations');
  `);
}

export async function down(): Promise<void> {
  // No reverse migration
}
