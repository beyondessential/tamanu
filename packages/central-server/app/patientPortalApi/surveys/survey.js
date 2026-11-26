import asyncHandler from 'express-async-handler';
import { SurveySchema, SurveyWithComponentsSchema } from '@tamanu/shared/schemas/patientPortal';
import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { NotFoundError } from '@tamanu/errors';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';

export const getSurvey = asyncHandler(async (req, res) => {
  const { params, patient } = req;
  const { models } = req.store;
  const { surveyId } = params;

  const portalSurveyAssignment = await models.PortalSurveyAssignment.findOne({
    where: {
      patientId: patient.id,
      surveyId,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
    },
    attributes: ['id', 'status', 'facilityId'],
  });
  if (!portalSurveyAssignment) {
    throw new NotFoundError('Survey was not found');
  }

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
    portalSurveyAssignment: portalSurveyAssignment.forResponse(),
  };

  // Parse the payload with zod to validate the data but return the unparsed payload
  // as zod is transforming dataElement.default options to a string unintentionally
  SurveyWithComponentsSchema.parse(payload);
  return res.send(payload);
});
