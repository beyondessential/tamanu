import { In } from 'typeorm';
import { checkJSONCriteria } from '~/ui/helpers/fields';
import { Survey } from '~/models/Survey';

function getQuestionCodesFromFormVisibilityCriteria(visibilityCriteria: string): string[] {
  if (!visibilityCriteria || !visibilityCriteria.trim()) return [];
  try {
    const criteria = JSON.parse(visibilityCriteria);
    if (!criteria || typeof criteria !== 'object') return [];
    return Object.keys(criteria).filter(key => key !== '_conjunction' && key !== 'hidden');
  } catch {
    return [];
  }
}

function checkFormVisibilityCriteria(
  criteria: string,
  valuesByCode: Record<string, any>,
  dataElementTypesByCode: Record<string, string> = {},
): boolean {
  if (!criteria || !criteria.trim()) return true;
  const allComponents = Object.entries(dataElementTypesByCode).map(([code, type]) => ({
    dataElement: { code, type },
  }));
  return checkJSONCriteria(criteria, allComponents as any, valuesByCode);
}

/**
 * Filters program surveys to those that pass form visibility criteria for the patient.
 * Surveys without visibility criteria are included. When patientId is missing or no
 * criteria exist, returns all surveys unchanged.
 */
export async function getProgramSurveysWithFormVisibility(
  models: any,
  surveys: Survey[],
  patientId: string | undefined,
): Promise<Survey[]> {
  const questionCodes = [
    ...new Set(
      surveys.flatMap(s =>
        getQuestionCodesFromFormVisibilityCriteria(s.visibilityCriteria || ''),
      ),
    ),
  ].filter(Boolean);

  if (!questionCodes.length || !patientId) {
    return surveys;
  }

  const valuesByCode = await models.SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(
    patientId,
    questionCodes,
  );
  const dataElements = await models.ProgramDataElement.find({
    where: { code: In(questionCodes) },
    select: ['code', 'type'],
  });
  const typesByCode = (dataElements || []).reduce(
    (acc: Record<string, string>, el: { code: string; type: string }) => {
      acc[el.code] = el.type;
      return acc;
    },
    {},
  );

  return surveys.filter((survey: Survey) => {
    const criteria = survey.visibilityCriteria;
    if (!criteria || !criteria.trim()) return true;
    return checkFormVisibilityCriteria(criteria, valuesByCode, typesByCode);
  });
}
