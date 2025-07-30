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

    await queryRunner.query(`
      WITH calculated_interaction_times AS (
        SELECT 
          pf.id,
          GREATEST(
            MAX(e.createdAt),
            MAX(pr.createdAt),
            pf.createdAt
          ) as calculated_last_interacted_time
        FROM patient_facilities pf
        LEFT JOIN patients p ON p.id = pf.patientId
        LEFT JOIN patient_program_registrations pr ON p.id = pr.patientId 
          AND pr.registering_facility_id = pf.facilityId
        LEFT JOIN encounters e ON p.id = e.patientId
        LEFT JOIN locations l ON e.locationId = l.id 
          AND l.facilityId = pf.facilityId
        GROUP BY pf.id, pf.createdAt
      )
      UPDATE patient_facilities pf
      SET last_interacted_time = cit.calculated_last_interacted_time
      FROM calculated_interaction_times cit
      WHERE pf.id = cit.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_facilities', 'lastInteractedTime');
    await queryRunner.dropColumn('patient_facilities', 'createdAtSyncTick');
  }
}
