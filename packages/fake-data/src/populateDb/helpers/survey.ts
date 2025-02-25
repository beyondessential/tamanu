import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateSurveyResponseParams {
  models: Models;
  encounterId: string;
  surveyId: string;
}
export const createSurveyResponse = async ({
  models: { SurveyResponse },
  encounterId,
  surveyId,
}: CreateSurveyResponseParams): Promise<void> => {
  await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId,
      encounterId,
    }),
  );
};
