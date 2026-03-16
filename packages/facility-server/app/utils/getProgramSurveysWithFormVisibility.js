import { Op } from 'sequelize';
import {
  checkFormVisibilityCriteria,
  getQuestionCodesFromFormVisibilityCriteria,
} from '@tamanu/shared/utils/criteria';
import { getLastSurveyAnswerValuesByQuestionCodes } from './getLastSurveyAnswerValuesByQuestionCodes';

/**
 * Returns survey list as API response shape with passesFormVisibility set.
 * When patientId is provided, evaluates form visibility criteria against the patient's last answers.
 *
 * @param {Object} models - Sequelize models
 * @param {Object[]} surveys - Survey model instances (filtered by permission)
 * @param {string} [patientId] - Optional patient ID for form visibility evaluation
 * @returns {Promise<Object[]>} Array of survey objects with forResponse() + passesFormVisibility
 */
export async function getProgramSurveysWithFormVisibility(models, surveys, patientId) {
  const data = surveys.map(s => ({
    ...s.forResponse(),
    passesFormVisibility: true,
  }));

  if (!patientId) {
    return data;
  }

  const questionCodes = [
    ...new Set(
      surveys.flatMap(s => getQuestionCodesFromFormVisibilityCriteria(s.visibilityCriteria || '')),
    ),
  ].filter(Boolean);

  if (questionCodes.length === 0) {
    return data;
  }

  const valuesByCode = await getLastSurveyAnswerValuesByQuestionCodes(
    models,
    patientId,
    questionCodes,
  );
  const dataElements = await models.ProgramDataElement.findAll({
    where: { code: { [Op.in]: questionCodes } },
    attributes: ['code', 'type'],
  });
  const typesByCode = dataElements.reduce((acc, el) => {
    acc[el.code] = el.type;
    return acc;
  }, {});

  for (const item of data) {
    const survey = surveys.find(s => s.id === item.id);
    const criteria = survey?.visibilityCriteria;
    if (criteria?.trim()) {
      item.passesFormVisibility = checkFormVisibilityCriteria(
        criteria,
        valuesByCode,
        typesByCode,
      );
    }
  }

  return data;
}
