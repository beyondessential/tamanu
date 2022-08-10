import { Op } from 'sequelize';

export async function getPatientSurveyResponseAnswer(models, patientId, questionId) {
  if (!questionId) {
    return null;
  }

  // Find the most recent non-empty answer to the question
  const answer = await models.SurveyResponseAnswer.findOne({
    include: {
      required: true,
      model: models.SurveyResponse,
      as: 'surveyResponse',
      include: { model: models.Encounter, where: { patientId }, as: 'encounter' },
    },
    where: {
      data_element_id: questionId,
      [Op.not]: [{ body: '' }],
    },
    order: [[{ model: models.SurveyResponse, as: 'surveyResponse' }, 'end_time', 'DESC']],
  });
  return answer?.body;
}
