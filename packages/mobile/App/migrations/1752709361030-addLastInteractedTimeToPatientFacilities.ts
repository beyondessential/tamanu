import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addLastInteractedTimeToPatientFacilities1752709361030 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('patient_facilities', new TableColumn({
      name: 'lastInteractedTime',
      type: 'datetime',
      default: "datetime('now')",
    }));

    await queryRunner.addColumn('patient_facilities', new TableColumn({
      name: 'createdAtSyncTick',
      type: 'bigint',
      default: -999,
    }));

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
          MAX(pr.createdAt) as max_registration_date,
          pf.createdAt as facility_created_at
        FROM patient_facilities pf
        JOIN patients p ON p.id = pf.patientId
        LEFT JOIN patient_program_registrations pr
          ON p.id = pr.patientId 
          AND pr.registeringFacilityId = pf.facilityId
        LEFT JOIN encounters e
          ON p.id = e.patientId
        LEFT JOIN locations l
          ON e.locationId = l.id
          AND l.facilityId = pf.facilityId
        GROUP BY pf.id, pf.createdAt
      )
      UPDATE patient_facilities
      SET lastInteractedTime = (
        SELECT 
          CASE
            WHEN COALESCE(md.max_encounter_date, '0') > COALESCE(md.max_registration_date, '0')
              AND COALESCE(md.max_encounter_date, '0') > md.facility_created_at
            THEN md.max_encounter_date
            WHEN COALESCE(md.max_registration_date, '0') > md.facility_created_at
            THEN md.max_registration_date
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
