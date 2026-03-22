import { QueryInterface } from 'sequelize';

// Migration to update the templates.type column to reference note types in reference_data.
export async function up(query: QueryInterface) {
  await query.sequelize.query(
    `
    UPDATE templates
    SET type = reference_data.id
    FROM reference_data
    WHERE reference_data.type = 'noteType'
      AND reference_data.code = templates.type
      AND templates.type != 'patientLetter'
    `,
  );
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(
    `
    UPDATE templates
    SET type = reference_data.code
    FROM reference_data
    WHERE reference_data.type = 'noteType'
      AND reference_data.id = templates.type
      AND templates.type != 'patientLetter'
    `,
  );
}
