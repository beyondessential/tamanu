import { randomRecordId } from '../randomRecord.js';

import { fake, fakeSurveyAnswerBody } from '../../fake/index.js';
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
  const { SurveyResponse, SurveyResponseAnswer, SurveyScreenComponent } = models;
  const responseSurveyId = surveyId ?? (await randomRecordId(models, 'Survey'));
  const surveyResponse = await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: responseSurveyId,
      encounterId: encounterId ?? (await randomRecordId(models, 'Encounter')),
    }),
  );

  const components = await SurveyScreenComponent.findAll({
    where: { surveyId: responseSurveyId },
    include: 'dataElement',
  });

  for (const { dataElement } of components) {
    await SurveyResponseAnswer.create(
      fake(SurveyResponseAnswer, {
        responseId: surveyResponse.id,
        dataElementId: dataElement.id,
        body: fakeSurveyAnswerBody(dataElement),
      }),
    );
  }
};
