import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Prescriptions that had been discontinued automatically by the MedicationDiscontinuer
  // prior to 2.34 had no discontinued date.
  await query.sequelize.query(`
    UPDATE prescriptions
    SET discontinued_date = end_date
    WHERE discontinued = true AND discontinued_date IS NULL
  `);

  // Rebuild lookup table so that the correct discontinued date is present
  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('prescriptions');
  `);
}

export async function down(): Promise<void> {
  // No reverse behaviour here
}
