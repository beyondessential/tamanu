import { MigrationInterface, QueryRunner } from 'typeorm';
import { TABLE_DEFINITIONS } from './firstTimeSetup/databaseDefinition';

// this is a specific migration for Nauru
// see https://beyondessential.slack.com/archives/C022N48Q3JQ/p1678779818104859?thread_ts=1678766342.369209&cid=C022N48Q3JQ
export class resyncSince123Deployed1678779906000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLE_DEFINITIONS.map(t => t.name)) {
      await queryRunner.query(`
        UPDATE ${tableName}
        SET updated_at_sync_tick = 1
        WHERE updated_at_sync_tick > -999;
      `);
    }
  }

  async down(): Promise<void> {
    return null; // can't go down from the up
  }
}
