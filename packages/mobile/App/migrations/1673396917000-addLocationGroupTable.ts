import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { BaseColumns, baseIndex } from './utils/baseColumns';

const LocationGroupTable = new Table({
  name: 'locationGroup',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
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

export class addLocationGroupTable1673396917000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Add locationGroup Table
    await queryRunner.createTable(LocationGroupTable, ifNotExist);
    // Add relation from location to locationGroup
    await queryRunner.addColumn(
      'location',
      new TableColumn({
        name: 'locationGroupId',
        isNullable: true,
        type: 'varchar',
      }),
    );

    await queryRunner.createForeignKey(
      'location',
      new TableForeignKey({
        columnNames: ['locationGroupId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'locationGroup',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop relation from location to locationGroup
    const locationTable = await queryRunner.getTable('location');
    const foreignKey = locationTable.foreignKeys.find(
      fk => fk.columnNames.indexOf('locationGroupId') !== -1,
    );
    await queryRunner.dropForeignKey('location', foreignKey);
    await queryRunner.dropColumn('location', 'locationGroupId');

    // Drop locationGroup Table
    await queryRunner.dropTable('locationGroup');
  }
}
