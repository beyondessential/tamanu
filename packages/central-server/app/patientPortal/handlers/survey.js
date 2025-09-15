import asyncHandler from 'express-async-handler';
import {
  SurveySchema,
  SurveyWithComponentsSchema,
} from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';
import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { NotFoundError } from '@tamanu/shared/errors';

export const getSurvey = asyncHandler(async (req, res) => {
  const { params } = req;
  const { models } = req.store;
  const { surveyId } = params;

  const surveyRecord = await models.Survey.findByPk(surveyId, {
    attributes: getAttributesFromSchema(SurveySchema),
  });

  if (!surveyRecord) {
    throw new NotFoundError('Survey was not found');
  }

  const components = await models.SurveyScreenComponent.getComponentsForSurvey(surveyRecord.id, {
    includeAllVitals: true,
  });

  const payload = {
    ...surveyRecord.forResponse(),
    components,
  };

  return res.send(SurveyWithComponentsSchema.parse(payload));
});
