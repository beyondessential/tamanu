import { QueryTypes, type Sequelize } from 'sequelize';

import { needsMigration, START } from './step.js';

// Shared by the two sensitive-network upgrade steps (spec: specs/sync/sensitive-networks.md).
//
// Sensitive facilities were islands: sync_lookup.facility_id was set to the facility's own id, and
// the outgoing snapshot admitted a row only when facility_id was null or the requesting facility's
// own. Two sensitive facilities therefore shared nothing. Every deployment takes exactly one of the
// two paths: the ordinary one preserves that isolation, Fiji's widens it for the SRH facilities.

// Ids, not codes: an import can edit a code, an id names the same facility forever.
export const FIJI_SRH_FACILITY_IDS = [
  'facility-SRHCentral',
  'facility-SRHWestern',
  'facility-SRHNorthern',
];

// A network of its own rather than one named after a member facility, whose id could never be
// corrected once other rows referenced it.
export const FIJI_SRH_NETWORK = { id: 'sensitiveNetwork-srh', code: 'SRH', name: 'SRH' };

// The record types that were network scoped when the sensitive-network upgrade was written: every
// model whose lookup query reaches encounters, which is the predicate syncLookupFacilityScope.test.ts
// enforces on new models. Notification is included, reaching encounters through its metadata.
//
// Pinned rather than derived from the model registry at run time, so every deployment rescopes the
// same tables whenever it upgrades. A model added after this shipped builds its lookup rows with
// network scoping from the start and has nothing to rescope, so the list is complete as it stands
// and should not be extended.
export const ENCOUNTER_SCOPED_RECORD_TYPES = [
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

// Both steps write columns createSensitiveNetworks adds, and both read is_sensitive, which
// dropFacilityIsSensitive removes.
export const BETWEEN_SCHEMA_MIGRATIONS = {
  at: START,
  after: [needsMigration('1789695736424-createSensitiveNetworks.ts')],
  before: [needsMigration('1789695736426-dropFacilityIsSensitive.ts')],
};

// What decides the path. A deleted facility does not count: it gained no network, so the ordinary
// path is what applies to it.
export const hasFijiSrhFacilities = async (sequelize: Sequelize) => {
  const [{ exists }] = await sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM facilities WHERE id IN (:facilityIds) AND deleted_at IS NULL);`,
    { replacements: { facilityIds: FIJI_SRH_FACILITY_IDS }, type: QueryTypes.SELECT },
  );
  return exists;
};
