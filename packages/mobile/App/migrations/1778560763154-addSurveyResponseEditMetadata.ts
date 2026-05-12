import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'survey_responses';

export class addSurveyResponseEditMetadata1778201000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      tableName,
      new TableColumn({
        name: 'editedAt',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(tableName, 'editedAt');
  }
}
