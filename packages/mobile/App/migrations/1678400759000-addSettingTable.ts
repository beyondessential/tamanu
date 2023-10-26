import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';
import { BaseColumns, baseIndex } from './utils/baseColumns';

const SettingTable = new Table({
  name: 'setting',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'key',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'value',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const ifNotExist = true;

export class addSettingTable1678400759000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(SettingTable, ifNotExist);

    await queryRunner.createIndex(SettingTable, baseIndex);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(SettingTable);
  }
}
