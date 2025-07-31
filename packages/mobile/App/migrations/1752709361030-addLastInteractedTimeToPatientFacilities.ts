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
   WITH calculated_interaction_times AS (
      SELECT 
        pf.id,
        MAX(
          CASE 
            WHEN e.createdAt IS NULL THEN pf.createdAt
            WHEN pf.createdAt > e.createdAt THEN pf.createdAt
            ELSE e.createdAt
          END
        ) as calculated_last_interacted_time
      FROM patient_facilities pf
      LEFT JOIN encounters e 
        ON pf.patientId = e.patientId
      LEFT JOIN locations l 
        ON e.locationId = l.id 
        AND l.facilityId = pf.facilityId
      WHERE (e.id IS NULL OR l.id IS NOT NULL)
      GROUP BY pf.id, pf.createdAt
    )
    UPDATE patient_facilities 
    SET lastInteractedTime = (
      SELECT calculated_last_interacted_time 
      FROM calculated_interaction_times 
      WHERE calculated_interaction_times.id = patient_facilities.id;
    );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_facilities', 'lastInteractedTime');
    await queryRunner.dropColumn('patient_facilities', 'createdAtSyncTick');
  }
}
