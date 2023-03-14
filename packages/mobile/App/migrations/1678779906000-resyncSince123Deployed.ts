import { MigrationInterface, QueryRunner } from 'typeorm';
// This is a specific migration for Nauru
// see https://beyondessential.slack.com/archives/C022N48Q3JQ/p1678779818104859?thread_ts=1678766342.369209&cid=C022N48Q3JQ
import { TABLE_DEFINITIONS } from './firstTimeSetup/databaseDefinition';

// Any records that haven't been touched, or that have synced from the central server into the
// mobile app, will have a sync tick of -999. We want to mark for resync all records that have
// a higher sync tick than that
const UNTOUCHED_SYNC_TICK = -999;

export class resyncSince123Deployed1678779906000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLE_DEFINITIONS.map(t => t.name)) {
      await queryRunner.query(`
        UPDATE ${tableName}
        SET updated_at_sync_tick = 1
        WHERE updated_at_sync_tick > ${UNTOUCHED_SYNC_TICK};
      `);
    }
  }

  async down(): Promise<void> {
    return null; // can't go down from the up
  }
}
