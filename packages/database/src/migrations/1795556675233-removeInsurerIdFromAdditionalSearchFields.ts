import { QueryInterface } from 'sequelize';

// Removing the patient insurer left `insurerId` in any deployment's configured additional patient
// search fields. The schema no longer accepts it, so every save of the global settings failed
// validation until it was taken out of the list.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE settings
    SET value = value - 'insurerId'
    WHERE key = 'patientSearch.additionalSearchFields'
      AND value @> '["insurerId"]'
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: which deployments had the insurer searchable is not recoverable, and the field
  // no longer exists to search on.
}
