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
    await queryRunner.query(`
      WITH max_dates AS (
        SELECT 
          pf.id as patient_facility_id,
          MAX(e.createdAt) as max_encounter_date,
          pf.createdAt as facility_created_at
        FROM patient_facilities pf
        LEFT JOIN encounters e
          ON pf.id = e.patientId
        LEFT JOIN locations l
          ON e.locationId = l.id
          AND l.facilityId = pf.facilityId
        WHERE (e.id IS NULL OR l.id IS NOT NULL)
        GROUP BY pf.id, pf.createdAt
      )
      UPDATE patient_facilities
      SET lastInteractedTime = (
        SELECT 
          CASE
            WHEN md.max_encounter_date IS NOT NULL
              AND md.max_encounter_date > md.facility_created_at
            THEN md.max_encounter_date
            ELSE md.facility_created_at
          END
        FROM max_dates md
        WHERE md.patient_facility_id = patient_facilities.id
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_facilities', 'lastInteractedTime');
    await queryRunner.dropColumn('patient_facilities', 'createdAtSyncTick');
  }
}
