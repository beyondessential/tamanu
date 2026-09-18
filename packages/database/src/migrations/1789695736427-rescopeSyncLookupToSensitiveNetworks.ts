import { QueryInterface, QueryTypes } from 'sequelize';

// DML only (spec: specs/sync/sensitive-networks.md).
//
// Existing lookup rows still carry the old scoping, where a record recorded at a sensitive facility
// was pinned to that facility's own id. Population now writes the facility's network instead and
// leaves the facility null, so these rows have to be moved over in the same upgrade — otherwise
// they stay pinned to one facility while new rows reach the whole network.
//
// Only rows the old sensitivity CASE wrote are touched: a facility that belongs to a network, on a
// record type that hangs off an encounter. A row scoped to a facility for genuine facility binding
// — a patient facility link, a facility-scoped setting — keeps its facility and is left alone.
//
// updated_at_sync_tick is deliberately untouched. Nothing stamps sync_lookup itself (the sync tick
// and hard-delete triggers sit on the source tables and write into it), so a direct update
// preserves ticks and no facility re-pulls a record it already holds.

// The record types that were network scoped when this migration was written: every model whose
// lookup query reaches encounters, which is the predicate syncLookupFacilityScope.test.ts enforces
// on new models. Notification is included, reaching encounters through its metadata.
//
// Pinned rather than derived from the model registry at run time, so every deployment rescopes the
// same tables whenever it upgrades. A model added after this shipped builds its lookup rows with
// network scoping from the start and has nothing to rescope, so the list is complete as it stands
// and should not be extended.
const ENCOUNTER_SCOPED_RECORD_TYPES = [
  'administered_vaccines',
  'ai_documents',
  'discharges',
  'document_metadata',
  'encounter_diagnoses',
  'encounter_diets',
  'encounter_history',
  'encounter_pause_prescription_histories',
  'encounter_pause_prescriptions',
  'encounter_prescriptions',
  'encounters',
  'imaging_request_areas',
  'imaging_requests',
  'imaging_results',
  'invoice_discounts',
  'invoice_insurer_payments',
  'invoice_item_discounts',
  'invoice_item_finalised_insurances',
  'invoice_items',
  'invoice_patient_payments',
  'invoice_payments',
  'invoices',
  'invoices_invoice_insurance_plans',
  'lab_request_attachments',
  'lab_request_logs',
  'lab_requests',
  'lab_test_panel_requests',
  'lab_tests',
  'medication_administration_record_doses',
  'medication_administration_records',
  'medication_dispenses',
  'notes',
  'notifications',
  'patient_ongoing_prescriptions',
  'pharmacy_order_prescriptions',
  'pharmacy_orders',
  'prescriptions',
  'procedure_assistant_clinicians',
  'procedure_survey_responses',
  'procedures',
  'referrals',
  'survey_response_answers',
  'survey_responses',
  'task_designations',
  'tasks',
  'triages',
  'vital_logs',
  'vitals',
];

// Without a networked facility there is nothing to move, and facility_id is unindexed.
const hasNetworkedFacility = async (query: QueryInterface) => {
  const [{ exists }] = await query.sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM facilities WHERE sensitive_network_id IS NOT NULL);`,
    { type: QueryTypes.SELECT },
  );
  return exists;
};

export async function up(query: QueryInterface): Promise<void> {
  if (!(await hasNetworkedFacility(query))) return;

  await query.sequelize.query(
    `
    UPDATE sync_lookup
    SET sensitive_network_id = facilities.sensitive_network_id,
        facility_id = NULL
    FROM facilities
    WHERE sync_lookup.facility_id = facilities.id
      -- a facility deleted while it was sensitive gained no network, so its rows keep their
      -- facility rather than ending up with neither scope and reaching everyone
      AND facilities.sensitive_network_id IS NOT NULL
      AND sync_lookup.record_type IN (:encounterScopedRecordTypes);
    `,
    {
      replacements: { encounterScopedRecordTypes: ENCOUNTER_SCOPED_RECORD_TYPES },
      type: QueryTypes.UPDATE,
    },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  if (!(await hasNetworkedFacility(query))) return;

  // A network of one restores exactly the facility the row used to carry. A network with several
  // members has no single facility to go back to, so those rows keep their network and the old
  // population logic would rebuild them.
  await query.sequelize.query(
    `
    UPDATE sync_lookup
    SET facility_id = sole_members.id,
        sensitive_network_id = NULL
    FROM (
      SELECT sensitive_network_id, MIN(id) AS id
      FROM facilities
      WHERE sensitive_network_id IS NOT NULL
      GROUP BY sensitive_network_id
      HAVING COUNT(*) = 1
    ) AS sole_members
    WHERE sync_lookup.sensitive_network_id = sole_members.sensitive_network_id
      AND sync_lookup.record_type IN (:encounterScopedRecordTypes);
    `,
    {
      replacements: { encounterScopedRecordTypes: ENCOUNTER_SCOPED_RECORD_TYPES },
      type: QueryTypes.UPDATE,
    },
  );
}
