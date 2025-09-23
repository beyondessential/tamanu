import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';
import { log } from '@tamanu/shared/services/logging/index';
import { CreateSurveyResponseRequestSchema } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';

const getDefaultResourceId = async (models, resource, facilityId) => {
  const key = `survey.defaultCodes.${resource}`;
  const code = await models.Setting.get(key, facilityId);

  const modelName = upperFirst(resource);
  const model = models[modelName];
  if (!model) {
    throw new Error(`Model not found: ${modelName}`);
  }

  const record = await model.findOne({ where: { code } });
  if (!record) {
    throw new Error(
      `Could not find default answer for '${resource}': code '${code}' not found (check survey.defaultCodes.${resource} in the settings)`,
    );
  }
  return record.id;
};

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

    const updatedBody = {
      patientId: patient.id,
      locationId:
        locationId || (await getDefaultResourceId(models, 'location', assignedSurvey.facilityId)),
      departmentId:
        departmentId ||
        (await getDefaultResourceId(models, 'department', assignedSurvey.facilityId)),
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
