import { QueryInterface } from 'sequelize';

// The dispensed-details columns added and backfilled on medication_dispenses (see
// 1783404000000-addDispensedDetailsToMedicationDispenses and its backfill) are not reflected in
// existing sync_lookup payloads, so flag the model for a rebuild to re-materialise them.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    SELECT flag_lookup_model_to_rebuild('medication_dispenses');
  `);
}

export async function down(): Promise<void> {
  // No reverse migration
}
