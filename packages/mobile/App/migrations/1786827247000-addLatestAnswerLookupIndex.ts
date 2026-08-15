import { MigrationInterface, QueryRunner } from 'typeorm';

const INDEX_NAME = 'IDX_survey_response_answers_latest_lookup';

/**
 * Single-purpose partial index for `SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes`. WHERE
 * clause mirrors the query’s filters exactly.
 */
export class addLatestAnswerLookupIndex1786827247000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "${INDEX_NAME}"
        ON "survey_response_answers" ("responseId", "dataElementId", "body", "id", "deletedAt")
        WHERE "deletedAt" IS NULL AND "body" IS NOT NULL AND "body" <> ''`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "${INDEX_NAME}"`);
  }
}
