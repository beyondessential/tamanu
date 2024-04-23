import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addVisibilityStatusForSurvey1713696066000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'survey');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'visibilityStatus',
        isNullable: false,
        type: 'varchar',
        default: "'current'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'survey');

    await queryRunner.dropColumn(tableObject, 'visibilityStatus');
  }
}
