import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

export class addSurveyResponseEditMetadata1778560763154 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'survey_responses',
      new TableColumn({
        name: 'editedAt',
        type: 'varchar',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'survey_response_answers',
      new TableColumn({
        name: 'editedAt',
        type: 'varchar',
        length: `${ISO9075_FORMAT_LENGTH}`,
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('survey_response_answers', 'editedAt');
    await queryRunner.dropColumn('survey_responses', 'editedAt');
  }
}
