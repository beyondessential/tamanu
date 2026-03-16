import { Op } from 'sequelize';

/**
 * Returns a map of question code -> most recent answer body for a patient.
 * Excludes deleted responses and answers (paranoid).
 * @param {Object} models - Sequelize models
 * @param {string} patientId
 * @param {string[]} questionCodes
 * @returns {Promise<Record<string, string>>}
 */
export async function getLastSurveyAnswerValuesByQuestionCodes(models, patientId, questionCodes) {
  if (!questionCodes?.length) return {};

  const { SurveyResponseAnswer, SurveyResponse, Encounter, ProgramDataElement } = models;

  const answers = await SurveyResponseAnswer.findAll({
    attributes: ['body', 'dataElementId'],
    include: [
      {
        model: SurveyResponse,
        as: 'surveyResponse',
        required: true,
        attributes: ['endTime'],
        include: [
          {
            model: Encounter,
            as: 'encounter',
            required: true,
            attributes: [],
            where: { patientId },
          },
        ],
      },
      {
        model: ProgramDataElement,
        required: true,
        attributes: ['code'],
        where: { code: { [Op.in]: questionCodes } },
      },
    ],
  });

  // Sort by response endTime descending so first occurrence per code is the most recent
  const sorted = answers
    .filter(answer => answer.surveyResponse?.endTime && answer.ProgramDataElement?.code)
    .sort((answerA, answerB) => {
      const endTimeA = new Date(answerA.surveyResponse.endTime).getTime();
      const endTimeB = new Date(answerB.surveyResponse.endTime).getTime();
      return endTimeB - endTimeA;
    });

  const valuesByCode = {};
  for (const row of sorted) {
    const code = row.ProgramDataElement?.code;
    if (code && valuesByCode[code] === undefined) {
      valuesByCode[code] = row.body ?? '';
    }
  }
  return valuesByCode;
}
