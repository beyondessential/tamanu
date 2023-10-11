import { CursorDataMigration } from '@tamanu/shared/dataMigrations';

export class ReformatMultiSelectSurveyResponses extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '00000000-0000-0000-0000-000000000000';

  async getQuery() {
    return `
      WITH updated AS (
        UPDATE survey_response_answers as sra
        SET body = ('["' || REPLACE(sra.body, ', ', '","') || '"]') 
        WHERE data_element_id IN (
            SELECT survey_response_answers.data_element_id
            FROM survey_response_answers
            JOIN program_data_elements ON survey_response_answers.data_element_id = program_data_elements.id
            WHERE program_data_elements.type = 'MultiSelect'
            AND survey_response_answers.id > $fromId
            AND NOT LIKE (sra.body, '["%"]')
            ORDER BY survey_response_answers.id
            LIMIT $limit
        )
          RETURNING id
      )
      SELECT 
        MAX(id::text) AS "maxId",
        COUNT(id) AS "count"
      FROM updated;
    `;
  }
}
