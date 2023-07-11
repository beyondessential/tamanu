import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'labRequest';
const referencedTableName = 'department';
const columnName = 'departmentId';

export class addDepartmentIdToLabRequest1676853984000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const labRequestTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      labRequestTable,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      labRequestTable,
      new TableForeignKey({
        columnNames: [columnName],
        referencedColumnNames: ['id'],
        referencedTableName: referencedTableName,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const labRequestTable = await queryRunner.getTable(tableName);
    const foreignKey = labRequestTable.foreignKeys.find(
      fk => fk.columnNames.indexOf(columnName) !== 0,
    );
    await queryRunner.dropForeignKey(labRequestTable, foreignKey);
    await queryRunner.dropColumn(labRequestTable, columnName);
  }
}
