import { QueryTypes } from 'sequelize';

/**
 * Returns a map of question code -> most recent answer body for a patient.
 * Uses DISTINCT ON to fetch only the latest answer per question code at the DB level.
 * Excludes deleted responses and answers (paranoid).
 * @param {Object} models - Sequelize models
 * @param {string} patientId
 * @param {string[]} questionCodes
 * @returns {Promise<Record<string, string>>}
 */
export async function getLastSurveyAnswerValuesByQuestionCodes(models, patientId, questionCodes) {
  if (!questionCodes?.length) return {};

  const { sequelize } = models.SurveyResponseAnswer;

  const rows = await sequelize.query(
    `SELECT DISTINCT ON (pde.code) pde.code, sra.body
     FROM survey_response_answers sra
     JOIN survey_responses sr ON sra.response_id = sr.id AND sr.deleted_at IS NULL
     JOIN encounters e ON sr.encounter_id = e.id AND e.deleted_at IS NULL
     JOIN program_data_elements pde ON sra.data_element_id = pde.id
     WHERE e.patient_id = :patientId
       AND pde.code IN (:questionCodes)
       AND sra.deleted_at IS NULL
       AND sra.body IS NOT NULL
       AND sra.body != ''
     ORDER BY pde.code, sr.end_time DESC NULLS LAST`,
    {
      replacements: { patientId, questionCodes },
      type: QueryTypes.SELECT,
    },
  );

  const valuesByCode = {};
  for (const row of rows) {
    valuesByCode[row.code] = row.body ?? '';
  }
  return valuesByCode;
}
