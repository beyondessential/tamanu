import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'lab_requests';
const columnName = 'resultsInterpretation';

export class addLabRequestResultsInterpretation1763435712934 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    const existingColumns = tableObject.columns.map(col => col.name);

    if (!existingColumns.includes(columnName)) {
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: columnName,
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    const existingColumns = tableObject.columns.map(col => col.name);

    if (existingColumns.includes(columnName)) {
      await queryRunner.dropColumn(tableObject, columnName);
    }
  }
}

