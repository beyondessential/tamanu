import { MigrationInterface, QueryRunner } from 'typeorm';

export class resyncPatientAdditionalData1669855692000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM patient_additional_data');
    // uuid generation based on
    // https://stackoverflow.com/questions/66625085/sqlite-generate-guid-uuid-on-select-into-statement
    await queryRunner.query(`
        INSERT INTO local_system_fact (id, key, value)
        VALUES (lower(
          hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
          substr(hex( randomblob(2)), 2) || '-' ||
          substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
          substr(hex(randomblob(2)), 2) || '-' ||
          hex(randomblob(6))
        ), 'tablesForFullResync', 'patient_additional_data')
      `);
  }

  async down(): Promise<void> {
    // destructive up, no possible down
  }
}
