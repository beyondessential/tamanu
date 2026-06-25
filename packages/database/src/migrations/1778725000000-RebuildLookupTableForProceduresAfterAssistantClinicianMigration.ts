import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('procedures');
  `);
}

export async function down(): Promise<void> {}
