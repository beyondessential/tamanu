import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('UPDATE patients SET date_of_death_legacy = now();');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('UPDATE patients SET date_of_birth_legacy = now();');
}
