import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateSurveyResponseDataParams {
  models: Models;
  encounterId: string;
  surveyId: string;
}
export const createSurveyResponseData = async ({
  models: { SurveyResponse },
  encounterId,
  surveyId,
}: CreateSurveyResponseDataParams): Promise<void> => {
  await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId,
      encounterId,
    }),
  );
};
