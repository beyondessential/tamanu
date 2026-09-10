import { randomRecordId } from '../randomRecord.js';

import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateSurveyResponseParams extends CommonParams {
  encounterId?: string;
  surveyId?: string;
}
export const createSurveyResponse = async ({
  models,
  encounterId,
  surveyId,
}: CreateSurveyResponseParams): Promise<void> => {
  const { ProgramDataElement, SurveyResponse, SurveyResponseAnswer, SurveyScreenComponent } =
    models;
  const resolvedSurveyId = surveyId || (await randomRecordId(models, 'Survey'));
  const response = await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: resolvedSurveyId,
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );

  const components = await SurveyScreenComponent.findAll({
    where: { surveyId: resolvedSurveyId },
  });
  for (const component of components) {
    // Older seeds carry components with no data element, which leaves nothing to answer.
    if (!component.dataElementId) {
      const dataElement = await ProgramDataElement.create(fake(ProgramDataElement));
      await component.update({ dataElementId: dataElement.id });
    }
    await SurveyResponseAnswer.create(
      fake(SurveyResponseAnswer, {
        responseId: response.id,
        dataElementId: component.dataElementId,
      }),
    );
  }
};
