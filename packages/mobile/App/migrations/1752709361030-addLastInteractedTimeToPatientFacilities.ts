import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addLastInteractedTimeToPatientFacilities1752709361030 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'patient_facilities',
      new TableColumn({
        name: 'lastInteractedTime',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await queryRunner.addColumn(
      'patient_facilities',
      new TableColumn({
        name: 'createdAtSyncTick',
        type: 'bigint',
        default: '0',
      }),
    );

    await queryRunner.query(`
      UPDATE patient_facilities
      SET createdAtSyncTick = updatedAtSyncTick;
    `);

    // Query differs from postgres version because of sqlite limitations
    // Calculate last interaction time based on:
    // - Encounters in that facility for that patient
    // - Program registrations in that facility for that patient
    // - If no interaction time is found, use the patient facility creation time
    await queryRunner.query(`
      WITH calculated_interaction_times AS (
        SELECT 
          pf.id,
          MAX(
            CASE 
              WHEN (e.createdAt IS NULL OR l.id IS NULL) AND ppr.createdAt IS NULL THEN pf.createdAt
              WHEN (e.createdAt IS NULL OR l.id IS NULL) AND ppr.createdAt IS NOT NULL THEN 
                CASE 
                  WHEN pf.createdAt > ppr.createdAt THEN pf.createdAt
                  ELSE ppr.createdAt
                END
              WHEN e.createdAt IS NOT NULL AND l.id IS NOT NULL AND ppr.createdAt IS NULL THEN
                CASE 
                  WHEN pf.createdAt > e.createdAt THEN pf.createdAt
                  ELSE e.createdAt
                END
              ELSE 
                CASE 
                  WHEN pf.createdAt > e.createdAt AND pf.createdAt > ppr.createdAt THEN pf.createdAt
                  WHEN e.createdAt > pf.createdAt AND e.createdAt > ppr.createdAt THEN e.createdAt
                  ELSE ppr.createdAt
                END
            END
          ) as calculated_last_interacted_time
        FROM patient_facilities pf
        LEFT JOIN encounters e 
          ON pf.patientId = e.patientId
        LEFT JOIN locations l 
          ON e.locationId = l.id 
          AND l.facilityId = pf.facilityId
        LEFT JOIN patient_program_registrations ppr
          ON pf.patientId = ppr.patientId
          AND pf.facilityId = ppr.registeringFacilityId
        WHERE l.id IS NOT NULL OR ppr.id IS NOT NULL
        GROUP BY pf.id, pf.createdAt
      )
      UPDATE patient_facilities 
      SET lastInteractedTime = COALESCE((
        SELECT calculated_last_interacted_time 
        FROM calculated_interaction_times 
        WHERE calculated_interaction_times.id = patient_facilities.id
      ), createdAt)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_facilities', 'lastInteractedTime');
    await queryRunner.dropColumn('patient_facilities', 'createdAtSyncTick');
  }
}
