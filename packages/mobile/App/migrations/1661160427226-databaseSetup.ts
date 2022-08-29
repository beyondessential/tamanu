import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  TABLE_DEFINITIONS,
} from './firstTimeSetup/databaseDefinition';

const ifNotExist = true;

export class databaseSetup1661160427226 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLE_DEFINITIONS) {
      // Create the tables only if they don't already exist
      await queryRunner.createTable(table, ifNotExist);
      const tableObject = queryRunner.getTable(table.name);
      console.log('table', tableObject);
    }
    await queryRunner.commitTransaction();
  }

  async down(queryRunner: QueryRunner): Promise<void> {
  }
}
