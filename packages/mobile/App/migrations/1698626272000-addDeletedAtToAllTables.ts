import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tablesToIgnore = ['android_metadata', 'migrations', 'sqlite_sequence'];

export class addDeletedAtToAllTables1698626272000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Add deletedAt column to all tables
    const tables = await queryRunner.query(
      `SELECT name 
       FROM sqlite_master 
       WHERE type='table';`,
    );

    const tableNames = tables.map((table: any) => table.name);
    const tablesToAddDeletedAt = tableNames.filter((t: string) => !tablesToIgnore.includes(t));

    for (const table of tablesToAddDeletedAt) {
      const tableObject = await getTable(queryRunner, table);
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: 'deletedAt',
          isNullable: true,
          type: 'date',
          default: null,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Add deletedAt column to all tables
    const tables = await queryRunner.query(
      `SELECT name 
       FROM sqlite_master 
       WHERE type='table';`,
    );

    const tableNames = tables.map((table: any) => table.name);
    const tablesToAddDeletedAt = tableNames.filter((t: string) => !tablesToIgnore.includes(t));

    for (const table of tablesToAddDeletedAt) {
      const tableObject = await getTable(queryRunner, table);
      await queryRunner.dropColumn(tableObject, 'deletedAt');
    }
  }
}
