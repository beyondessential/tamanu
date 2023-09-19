import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'survey_screen_component';

export class addVisibilityStatusToSurveyScreenComponents1695096053000
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'visibilityStatus',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, 'visibilityStatus');
  }
}
