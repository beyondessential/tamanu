import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SQLite doesn't index foreign keys automatically. These are the per-patient and per-encounter
 * lookups that still full-scanned their (facility-wide) tables after the earlier index passes.
 */
const QUERY_INDEXES = [
  // Encounter.getForPatient joins diagnoses onto each of the patient's encounters (visits history)
  ['encounter_diagnoses', 'IDX_encounter_diagnoses_encounterId', ['encounterId']],
  // PatientProgramRegistrationCondition.findForRegistration — registration details screen
  [
    'patient_program_registration_conditions',
    'IDX_patient_program_registration_conditions_patientProgramRegistrationId',
    ['patientProgramRegistrationId'],
  ],
  // Allergy check when prescribing medication
  ['patient_allergies', 'IDX_patient_allergies_patientId', ['patientId']],
  // Patient issues list on patient details
  ['patient_issues', 'IDX_patient_issues_patientId', ['patientId']],
  // Reminder contacts list per patient
  ['patient_contacts', 'IDX_patient_contacts_patientId', ['patientId']],
  // Encounter.getCurrentEncounterForPatient / getActiveEncounterForPatient filter by patientId and
  // take the latest by startDate, so a composite serves the ORDER BY … LIMIT 1 without a sort.
  // Supersedes the original patientId-only index, dropped below.
  ['encounters', 'IDX_encounters_patientId_startDate', ['patientId', 'startDate']],
] as const;

/**
 * TypeORM-generated name (a deterministic hash of table + column, so identical on every device) of
 * the original `encounters (patientId)` index from the first-time setup, which the composite above
 * makes redundant.
 */
const SUPERSEDED_ENCOUNTERS_PATIENT_ID_INDEX = 'IDX_79528cb799cc63dadd8895fd9b';

export class addPerPatientLookupIndexes1789611060000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [tableName, name, columnNames] of QUERY_INDEXES) {
      const columns = columnNames.map(column => `"${column}"`).join(', ');
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${tableName}" (${columns})`,
      );
    }
    await queryRunner.query(`DROP INDEX IF EXISTS "${SUPERSEDED_ENCOUNTERS_PATIENT_ID_INDEX}"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "${SUPERSEDED_ENCOUNTERS_PATIENT_ID_INDEX}" ON "encounters" ("patientId")`,
    );
    for (const [, name] of [...QUERY_INDEXES].reverse()) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }
}
