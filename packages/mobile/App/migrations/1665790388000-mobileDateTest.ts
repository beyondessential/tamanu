import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class mobileDateTest1665790388000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patient');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'foo',
        type: 'date',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient', 'foo');
  }
}
