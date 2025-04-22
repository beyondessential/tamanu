import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Set deletedAt for historical records with registrationStatus = recordedInError
  // Use the date field value as deletedAt value, with proper timestamp conversion
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET deleted_at = date::timestamp
    WHERE registration_status = 'recordedInError' AND deleted_at IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Revert the changes by setting deletedAt back to null
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET deleted_at = NULL
    WHERE registration_status = 'recordedInError'
  `);
}
