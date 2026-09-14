import { Op } from 'sequelize';

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
  const { SurveyResponse, SurveyResponseAnswer, SurveyScreenComponent } = models;
  const resolvedSurveyId = surveyId || (await randomRecordId(models, 'Survey'));
  const response = await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: resolvedSurveyId,
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );

  // Seeds from older versions carry components with no data element, which leaves nothing
  // to answer.
  const components = await SurveyScreenComponent.findAll({
    where: { surveyId: resolvedSurveyId, dataElementId: { [Op.ne]: null } },
  });
  await SurveyResponseAnswer.bulkCreate(
    components.map(({ dataElementId }) =>
      fake(SurveyResponseAnswer, { responseId: response.id, dataElementId }),
    ),
  );
};
