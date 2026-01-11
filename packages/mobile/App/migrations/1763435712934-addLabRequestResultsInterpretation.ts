import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'lab_requests';
const columnName = 'resultsInterpretation';

export class addLabRequestResultsInterpretation1763435712934 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: columnName,
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    await queryRunner.dropColumn(tableObject, columnName);
  }
}

