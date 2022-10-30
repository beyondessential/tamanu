import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  TABLE_DEFINITIONS,
} from './firstTimeSetup/databaseDefinition';

const ifNotExist = true;

async function testSkipMigration(queryRunner: QueryRunner) : Promise<boolean> {
  const patientTable = await queryRunner.query("SELECT * FROM sqlite_master WHERE type='table' AND name='patient';");
  return patientTable.length > 0;
}

export class databaseSetup1661160427226 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await testSkipMigration(queryRunner)) {
      console.log('Skipping migration 1661160427226-databaseSetup as the result has already been achieved by a forced sync');
      return;
    }
    for (const table of TABLE_DEFINITIONS) {
      // Create the tables only if they don't already exist
      await queryRunner.createTable(table, ifNotExist);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
  }
}
