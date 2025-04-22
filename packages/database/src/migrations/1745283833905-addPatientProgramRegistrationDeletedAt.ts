import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Set deletedAt for historical records with registrationStatus = recordedInError
  // Use the date field value as deletedAt value
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET deletedAt = date
    WHERE registrationStatus = 'recordedInError' AND deletedAt IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Revert the changes by setting deletedAt back to null
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET deletedAt = NULL
    WHERE registrationStatus = 'recordedInError'
  `);
}
