import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      UPDATE permissions
      SET id = REPLACE(id, 'encountermedication', 'medication')
      WHERE id LIKE '%encountermedication%'
      AND noun = 'Medication';
    `,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      UPDATE permissions
      SET id = REPLACE(id, 'medication', 'encountermedication')
      WHERE id LIKE '%medication%' 
        AND id NOT LIKE '%encountermedication%'
        AND noun = 'Medication';
    `,
  );
}
