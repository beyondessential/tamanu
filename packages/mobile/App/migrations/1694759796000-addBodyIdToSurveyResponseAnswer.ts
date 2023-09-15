import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'survey_response_answer';
const columnName = 'bodyId';

export class addBodyIdToSurveyResponseAnswer1694759796000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const sraTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(sraTable, new TableColumn({
      name: columnName,
      type: 'varchar',
      isNullable: true,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const sraTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(sraTable, columnName);
  }
}
