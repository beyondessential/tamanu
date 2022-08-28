import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  TABLE_DEFINITIONS,
  INDEX_DEFINITIONS,
  FK_DEFINITIONS,
  createTableWithBaseIndex,
} from './firstTimeSetup/databaseDefinition';

export class databaseSetup1661160427226 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: If the db already exists, don't run any of this
    for (const table of TABLE_DEFINITIONS) {
      await createTableWithBaseIndex(queryRunner, table);
    }
    for (const index of INDEX_DEFINITIONS) {
      await queryRunner.createIndex(index.tableName, index.tableIndex);
    }
    for (const foreignKey of FK_DEFINITIONS) {
      await queryRunner.createForeignKeys(foreignKey.tableName, foreignKey.foreignKeys);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
  }
}
