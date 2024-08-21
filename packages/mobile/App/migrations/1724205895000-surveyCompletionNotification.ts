import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class surveyCompletionNotification1724205895000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const surveyTable = await getTable(queryRunner, 'survey');
    await queryRunner.addColumn(
      surveyTable,
      new TableColumn({
        name: 'notifiable',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );

    const surveyResponseTable = await getTable(queryRunner, 'survey_response');
    await queryRunner.addColumn(
      surveyResponseTable,
      new TableColumn({
        name: 'notified',
        type: 'boolean',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const surveyTable = await getTable(queryRunner, 'survey');
    await queryRunner.dropColumn(surveyTable, 'notifiable');

    const surveyResponseTable = await getTable(queryRunner, 'survey_response');
    await queryRunner.dropColumn(surveyResponseTable, 'notified');
  }
}
