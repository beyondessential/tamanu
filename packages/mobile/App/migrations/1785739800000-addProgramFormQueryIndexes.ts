import { MigrationInterface, QueryRunner } from 'typeorm';

// SQLite doesn't index foreign keys automatically, so these joins were all driving off full table
// scans of the largest tables on the device.
const INDEXES = [
  ['survey_responses', 'IDX_survey_responses_encounterId', ['encounterId']],
  ['survey_response_answers', 'IDX_survey_response_answers_responseId', ['responseId']],
  ['survey_response_answers', 'IDX_survey_response_answers_dataElementId', ['dataElementId']],
  ['program_data_elements', 'IDX_program_data_elements_code', ['code']],
  [
    'procedure_survey_responses',
    'IDX_procedure_survey_responses_surveyResponseId',
    ['surveyResponseId'],
  ],
] as const;

export class addProgramFormQueryIndexes1785739800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [tableName, name, columnNames] of INDEXES) {
      const columns = columnNames.map(column => `"${column}"`).join(', ');
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${tableName}" (${columns})`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [, name] of [...INDEXES].reverse()) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }
}
