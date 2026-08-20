import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Every sync push snapshots outgoing changes with `WHERE updatedAtSyncTick > ?` on every pushable
 * table. The v2 sync migration indexed that column on all then-existing tables, but new tables have
 * been created without it (e.g. allergies, contacts, encounter history, …), so each sync full-scans
 * them.
 */
const SYNC_TICK_TABLES = [
  'encounter_history',
  'encounter_prescriptions',
  'medication_administration_records',
  'patient_allergies',
  'patient_contacts',
  'patient_ongoing_prescriptions',
  'prescriptions',
  'procedure_survey_responses',
  'procedures',
  'task_designations',
  'tasks',
] as const;

/** SQLite doesn't index foreign keys automatically */
const QUERY_INDEXES = [
  // AdministeredVaccine.getForPatient — vaccines table screen, joins encounters → administered_vaccines
  ['administered_vaccines', 'IDX_administered_vaccines_encounterId', ['encounterId']],
  // Survey.getComponents — every program/vitals form open filters by surveyId
  ['survey_screen_components', 'IDX_survey_screen_components_surveyId', ['surveyId']],
  // Patient.getVitals and Referral.getForPatient join survey_screen_components on dataElementId
  ['survey_screen_components', 'IDX_survey_screen_components_dataElementId', ['dataElementId']],
  // Patient search always orders by lastName, firstName with LIMIT 100; with an empty search box
  // it matches all patients, so ordering via index lets SQLite stop after the first 100
  ['patients', 'IDX_patients_lastName_firstName', ['lastName', 'firstName']],
  // Program registry summary/list per patient, and PPR upsert on survey submit
  ['patient_program_registrations', 'IDX_patient_program_registrations_patientId', ['patientId']],
  // Patient search "program registry" filter subquery
  [
    'patient_program_registrations',
    'IDX_patient_program_registrations_programRegistryId_registrationStatus',
    ['programRegistryId', 'registrationStatus'],
  ],
  // PatientAdditionalData.getForPatient — patient details and most clinical forms
  ['patient_additional_data', 'IDX_patient_additional_data_patientId', ['patientId']],
  // Encounter.getForPatient loads notes by recordId (polymorphic FK) for the visits history
  ['notes', 'IDX_notes_recordId', ['recordId']],
  // LabRequest.getForPatient — lab history screen
  ['lab_requests', 'IDX_lab_requests_encounterId', ['encounterId']],
  // Referral.getForPatient — referral history screen
  ['referrals', 'IDX_referrals_initiatingEncounterId', ['initiatingEncounterId']],
  // Suggesters and reference data dropdowns filter by type on every keystroke/mount
  ['reference_data', 'IDX_reference_data_type', ['type']],
  // Task dedup lookup per generated MAR, and task lists per encounter
  ['tasks', 'IDX_tasks_encounterId', ['encounterId']],
  // EncounterPrescription lookup per prescription when generating MAR tasks
  ['encounter_prescriptions', 'IDX_encounter_prescriptions_prescriptionId', ['prescriptionId']],
  // Custom patient fields loaded per patient on details screens
  ['patient_field_values', 'IDX_patient_field_values_patientId', ['patientId']],
  // Lab tests loaded per lab request
  ['lab_tests', 'IDX_lab_tests_labRequestId', ['labRequestId']],
  // Patient.markForSync existence check before every new encounter/PAD/PPR insert
  ['patient_facilities', 'IDX_patient_facilities_patientId', ['patientId']],
  // Report widgets aggregate encounters by deviceId over a date window
  ['encounters', 'IDX_encounters_deviceId_startDate', ['deviceId', 'startDate']],
] as const;

const ALL_INDEXES: readonly (readonly [string, string, readonly string[]])[] = [
  ...SYNC_TICK_TABLES.map(
    table => [table, `IDX_${table}_updatedAtSyncTick`, ['updatedAtSyncTick']] as const,
  ),
  ...QUERY_INDEXES,
];

export class addHotPathQueryIndexes1786664141000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [tableName, name, columnNames] of ALL_INDEXES) {
      const columns = columnNames.map(column => `"${column}"`).join(', ');
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${tableName}" (${columns})`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [, name] of [...ALL_INDEXES].reverse()) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }
}
