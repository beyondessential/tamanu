import { QueryInterface, QueryTypes } from 'sequelize';

// These models now populate sync_lookup.facility_id for records belonging to a sensitive facility,
// so that they only sync back to the facility they were recorded at. Existing lookup rows were
// materialised before that change and still have a NULL facility_id, so flag the models for a
// rebuild to re-materialise them.
//
// The rebuild corrects what other facilities pull from here on; it does not retract records those
// facilities have already pulled.
const MODELS_TO_REBUILD = [
  'ai_documents',
  'medication_dispenses',
  'vitals',
  'pharmacy_order_prescriptions',
];

// Only worth rebuilding where a facility is actually marked sensitive: without one every rebuilt row
// is identical, and vitals in particular is large enough that the rebuild is not free. Matches the
// predicate the lookup select itself uses (ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE), so deleted
// facilities are not excluded here either.
const hasSensitiveFacility = async (query: QueryInterface) => {
  const [{ exists }] = await query.sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM facilities WHERE is_sensitive = TRUE);`,
    { type: QueryTypes.SELECT },
  );
  return exists;
};

export async function up(query: QueryInterface): Promise<void> {
  if (!(await hasSensitiveFacility(query))) return;

  for (const tableName of MODELS_TO_REBUILD) {
    await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild(:tableName);`, {
      replacements: { tableName },
    });
  }
}

export async function down(): Promise<void> {
  // No reverse migration
}
