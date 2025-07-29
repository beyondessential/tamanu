import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addLastInteractedTimeToPatientFacilities1752709361030 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable('patient_facilities');
    await queryRunner.addColumn(table, new TableColumn({
      name: 'last_interacted_time',
      type: 'datetime',
      default: "datetime('now')",
    }));

    await queryRunner.addColumn(table, new TableColumn({
      name: 'created_at_sync_tick',
      type: 'bigint',
      default: -999,
    }));

    await queryRunner.query(`
      UPDATE patient_facilities
      SET created_at_sync_tick = updated_at_sync_tick;
    `);

    await queryRunner.query(`
      WITH calculated_interaction_times AS (
        SELECT 
          pf.id,
          GREATEST(
            MAX(e.created_at),
            MAX(pr.created_at),
            pf.created_at
          ) as calculated_last_interacted_time
        FROM patient_facilities pf
        LEFT JOIN patients p ON p.id = pf.patient_id
        LEFT JOIN patient_program_registrations pr ON p.id = pr.patient_id 
          AND pr.registering_facility_id = pf.facility_id
        LEFT JOIN encounters e ON p.id = e.patient_id
        LEFT JOIN locations l ON e.location_id = l.id 
          AND l.facility_id = pf.facility_id
        GROUP BY pf.id, pf.created_at
      )
      UPDATE patient_facilities pf
      SET last_interacted_time = cit.calculated_last_interacted_time
      FROM calculated_interaction_times cit
      WHERE pf.id = cit.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable('patient_facilities');
    await queryRunner.dropColumn(table, 'last_interacted_time');
    await queryRunner.dropColumn(table, 'created_at_sync_tick');
  }
}
