import { MigrationInterface, QueryRunner } from 'typeorm';

// Hardcoded note types to create in reference_data for mobile
const NOTE_TYPE_REFERENCE_DATA = [
  { id: 'notetype-treatmentPlan', code: 'treatmentPlan', name: 'Treatment plan' },
  { id: 'notetype-discharge', code: 'discharge', name: 'Discharge planning' },
  { id: 'notetype-clinicalMobile', code: 'clinicalMobile', name: 'Clinical note (mobile)' },
  { id: 'notetype-handover', code: 'handover', name: 'Handover note' },
  { id: 'notetype-areaToBeImaged', code: 'areaToBeImaged', name: 'Area to be imaged' },
  { id: 'notetype-resultDescription', code: 'resultDescription', name: 'Result description' },
  { id: 'notetype-other', code: 'other', name: 'Other' },
  { id: 'notetype-system', code: 'system', name: 'System' },
  { id: 'notetype-admission', code: 'admission', name: 'Admission' },
  { id: 'notetype-medical', code: 'medical', name: 'Medical' },
  { id: 'notetype-surgical', code: 'surgical', name: 'Surgical' },
  { id: 'notetype-nursing', code: 'nursing', name: 'Nursing' },
  { id: 'notetype-dietary', code: 'dietary', name: 'Dietary' },
  { id: 'notetype-pharmacy', code: 'pharmacy', name: 'Pharmacy' },
  { id: 'notetype-physiotherapy', code: 'physiotherapy', name: 'Physiotherapy' },
  { id: 'notetype-social', code: 'social', name: 'Social welfare' },
];

export class migrateNoteTypesToReferenceData1761474536815 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const noteType of NOTE_TYPE_REFERENCE_DATA) {
      await queryRunner.query(
        `
        INSERT INTO reference_data (id, type, code, name, visibilityStatus)
        VALUES (?, 'noteType', ?, ?, 'current')
        ON CONFLICT(id) DO UPDATE SET
          code = excluded.code,
          name = excluded.name,
          visibilityStatus = 'current',
          updated_at_sync_tick = 1
        `,
        [noteType.id, noteType.code, noteType.name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM reference_data WHERE type = 'noteType'`);
  }
}


