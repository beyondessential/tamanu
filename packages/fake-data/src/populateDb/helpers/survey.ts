import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';
import { times } from 'lodash';

interface CreateSurveyResponseParams extends CommonParams {
  encounterId: string;
  surveyId: string;
  answerCount?: number;
}
export const createSurveyResponse = async ({
  models,
  encounterId,
  surveyId,
  answerCount = chance.integer({ min: 1, max: 5 }),
}: CreateSurveyResponseParams): Promise<void> => {
  const { SurveyResponse, SurveyResponseAnswer } = models;
  const surveyResponse = await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: surveyId || (await randomRecordId(models, 'Survey')),
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );
  times(answerCount, async () => {
    await SurveyResponseAnswer.create(
      fake(SurveyResponseAnswer, {
        responseId: surveyResponse.id,
        dataElementId: (await randomRecordId(models, 'ProgramDataElement')).id,
      }),
    );
  });
};
