import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import { CreateSurveyResponseRequestSchema } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/shared/errors';

export const createSurveyResponse = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const body = CreateSurveyResponseRequestSchema.parse(req.body);

  const assignedSurvey = await models.PortalSurveyAssignment.findOne({
    where: {
      patientId: patient.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      surveyId: body.surveyId,
    },
  });

  if (!assignedSurvey) {
    log.error('Patient attempted to submit response for invalid assigned survey', {
      patientId: patient.id,
      surveyId: body.surveyId,
    });
    throw new NotFoundError('Survey was not assigned to the patient');
  }

  const responseRecord = await req.store.sequelize.transaction(async () => {
    const { locationId, departmentId, ...payload } = body;
    // const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type, settings);

    const updatedBody = {
      patientId: patient.id,
      // Todo: get location and department from settings
      // locationId: locationId || (await getDefaultId('location')),
      // departmentId: departmentId || (await getDefaultId('department')),
      locationId: locationId || 'location-GeneralClinic',
      departmentId: departmentId || 'department-GeneralClinic',
      userId: SYSTEM_USER_UUID, // Submit as system-user since the logged-in user is the patient
      facilityId: assignedSurvey.facilityId,
      ...payload,
    };
    const surveyResponse = await models.SurveyResponse.createWithAnswers(updatedBody);
    await assignedSurvey.update({
      surveyResponseId: surveyResponse.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
    });

    return surveyResponse;
  });

  return res.send(responseRecord);
});
