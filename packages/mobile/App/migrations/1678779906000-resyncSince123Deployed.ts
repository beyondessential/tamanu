import { MigrationInterface, QueryRunner } from 'typeorm';
// This is a specific migration for Nauru
// see https://beyondessential.slack.com/archives/C022N48Q3JQ/p1678779818104859?thread_ts=1678766342.369209&cid=C022N48Q3JQ
import { TABLE_DEFINITIONS } from './firstTimeSetup/databaseDefinition';

// Any records that haven't been touched, or that have synced from the central server into the
// mobile app, will have a sync tick of -999. We want to mark for resync all records that have
// a higher sync tick than that
const UNTOUCHED_SYNC_TICK = -999;

const TABLES_TO_RESYNC = [...TABLE_DEFINITIONS.map(t => t.name), 'patient_facility'];

const CURRENT_SYNC_TIME = 'currentSyncTick';

export class resyncSince123Deployed1678779906000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const localSystemFacts = await queryRunner.query(`
      SELECT value FROM local_system_fact WHERE key = '${CURRENT_SYNC_TIME}'
    `);

    if (!localSystemFacts?.length) {
      return; // must be fresh install -> no need to resync
    }

    const [{ value: currentSyncTimeValue }] = localSystemFacts;

    const currentSyncTime = parseInt(currentSyncTimeValue, 10);

    for (const tableName of TABLES_TO_RESYNC) {
      await queryRunner.query(`
        UPDATE ${tableName}
        SET updatedAtSyncTick = ${currentSyncTime}
        WHERE updatedAtSyncTick > ${UNTOUCHED_SYNC_TICK};
      `);
    }
  }

  async down(): Promise<void> {
    return null; // can't go down from the up
  }
}
