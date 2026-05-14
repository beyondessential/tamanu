import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'survey_responses';

const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export class addSurveyResponseEditMetadata1778560763154 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      tableName,
      new TableColumn({
        name: 'editedAt',
        type: 'varchar',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(tableName, 'editedAt');
  }
}
