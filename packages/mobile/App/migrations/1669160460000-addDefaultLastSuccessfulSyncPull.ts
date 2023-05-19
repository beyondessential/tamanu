import { MigrationInterface, QueryRunner } from 'typeorm';

const LAST_SUCCESSFUL_SYNC_PULL = 'lastSuccessfulSyncPull';

export class addDefaultLastSuccessfulSyncPull1669160460000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const [patientCountRow] = await queryRunner.query(`
      SELECT COUNT(*) AS "count" FROM patient
    `);

    const [localSystemFactRow] = await queryRunner.query(`
      SELECT id FROM local_system_fact WHERE key = '${LAST_SUCCESSFUL_SYNC_PULL}'
    `);

    const patientCount = parseInt(patientCountRow.count, 10);

    // Insert default lastSuccessfulSyncPull = 0
    // if the device already has synced data and is being upgraded
    // AND lastSuccessfulSyncPull does not exist
    if (patientCount && !localSystemFactRow?.id) {
      //uuid generation
      // https://stackoverflow.com/questions/66625085/sqlite-generate-guid-uuid-on-select-into-statement
      await queryRunner.query(`
        INSERT INTO local_system_fact (id, key, value)
        VALUES (lower(
          hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || 
          substr(hex( randomblob(2)), 2) || '-' || 
          substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
          substr(hex(randomblob(2)), 2) || '-' || 
          hex(randomblob(6))
        ), '${LAST_SUCCESSFUL_SYNC_PULL}', 0)
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM local_system_fact
      WHERE key = '${LAST_SUCCESSFUL_SYNC_PULL}'
    `);
  }
}
