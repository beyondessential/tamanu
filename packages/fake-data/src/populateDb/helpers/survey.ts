import type { Models } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake } from '../../fake';

interface CreateSurveyResponseParams {
  models: Models;
  encounterId: string;
  surveyId: string;
}
export const createSurveyResponse = async ({
  models,
  encounterId,
  surveyId,
}: CreateSurveyResponseParams): Promise<void> => {
  const { SurveyResponse } = models;
  await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: surveyId || (await randomRecordId(models, 'Survey')),
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );
};
