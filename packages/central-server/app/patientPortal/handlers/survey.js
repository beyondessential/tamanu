import asyncHandler from 'express-async-handler';
import { SurveySchema, SurveyWithComponentsSchema } from '@tamanu/shared/schemas/patientPortal';
import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { NotFoundError } from '@tamanu/shared/errors';

export const getSurvey = asyncHandler(async (req, res) => {
  const { params } = req;
  const { models } = req.store;
  const { surveyId } = params;

  const surveyRecord = await models.Survey.findByPk(surveyId, {
    attributes: getAttributesFromSchema(SurveySchema),
    include: ['portalSurveyAssignments'],
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
    portalSurveyAssignment: surveyRecord.portalSurveyAssignments?.[0] || null,
  };

  // Remove the array version
  delete payload.portalSurveyAssignments;

  // Parse the payload with zod to validate the data but return the unparsed payload
  // as zod is transforming dataElement.default options to a string unintentionally
  SurveyWithComponentsSchema.parse(payload);
  return res.send(payload);
});
