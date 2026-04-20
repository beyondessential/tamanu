import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addSurveyFormVisibilityCriteria1773618699809 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'surveys');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'visibilityCriteria',
        isNullable: true,
        type: 'text',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'surveys');

    await queryRunner.dropColumn(tableObject, 'visibilityCriteria');
  }
}
