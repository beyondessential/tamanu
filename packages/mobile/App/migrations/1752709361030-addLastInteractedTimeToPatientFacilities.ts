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
    UPDATE patient_facilities
      SET lastInteractedTime = (
    SELECT GREATEST(
        COALESCE(MAX(e.createdAt), '0'),
        COALESCE(MAX(pr.createdAt), '0'),
        patient_facilities.createdAt
    )
    FROM patients p
    LEFT JOIN patient_program_registrations pr 
        ON p.id = pr.patientId 
        AND pr.registeringFacilityId = patient_facilities.facilityId
    LEFT JOIN encounters e 
        ON p.id = e.patientId
    LEFT JOIN locations l 
        ON e.locationId = l.id 
        AND l.facilityId = patient_facilities.facilityId
    WHERE p.id = patient_facilities.patientId
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_facilities', 'lastInteractedTime');
    await queryRunner.dropColumn('patient_facilities', 'createdAtSyncTick');
  }
}
