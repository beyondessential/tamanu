import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { PortalSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';

import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { SurveySchema, SurveyWithComponentsSchema } from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';
import { CreateSurveyResponseRequestSchema } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
import { NotFoundError } from '@tamanu/shared/errors';

export const getOutstandingSurveys = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const outstandingSurveys = await models.PortalSurveyAssignment.findAll({
    where: {
      patientId: patient.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
    },
    attributes: getAttributesFromSchema(PortalSurveyAssignmentSchema),
    include: [
      {
        model: models.Survey,
        attributes: getAttributesFromSchema(PortalSurveyAssignmentSchema.shape.survey),
        as: 'survey',
      },
      {
        model: models.User,
        attributes: getAttributesFromSchema(PortalSurveyAssignmentSchema.shape.assignedBy),
        as: 'assignedBy',
      },
    ],
  });

  return res.send({
    data: outstandingSurveys.map(survey => PortalSurveyAssignmentSchema.parse(survey.forResponse())),
  });
});

export const getSurvey = asyncHandler(async (req, res) => {
  const { patient, params } = req;
  const { models } = req.store;
  const { assignmentId } = params;

  const assignedSurvey = await models.PortalSurveyAssignment.findOne({
    where: {
      id: assignmentId,
      patientId: patient.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
    },
  });

  if (!assignedSurvey) {
    log.warn('Patient attempted to fetch survey for invalid assigned survey', {
      assignmentId,
      patientId: patient.id,
    });
    throw new NotFoundError('Survey was not assigned to the patient');
  }

  const surveyRecord = await models.Survey.findByPk(assignedSurvey.surveyId, {
    attributes: getAttributesFromSchema(SurveySchema.shape.survey),
  });

  if (!surveyRecord) {
    log.warn('Unexpected survey not found, assignment has invalid surveyId', {
      assignmentId,
      patientId: patient.id,
      surveyId: assignedSurvey.surveyId,
    });
    throw new NotFoundError('Survey was not found');
  }

  const components = await models.SurveyScreenComponent.getComponentsForSurvey(
    surveyRecord.id,
    { includeAllVitals: true },
  );

  const payload = {
    ...surveyRecord.forResponse(),
    components,
  };

  return res.send(SurveyWithComponentsSchema.parse(payload));
}); 

export const createSurveyResponse = asyncHandler(async (req, res) => {
  const { patient, settings, params } = req;
  const { models } = req.store;
  const { assignmentId } = params;

  const body = CreateSurveyResponseRequestSchema.parse(req.body);

  const assignedSurvey = await models.PortalSurveyAssignment.findOne({
    where: {
      id: assignmentId,
      patientId: patient.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      surveyId: body.surveyId,
    },
  }); 
 
    if (!assignedSurvey) {
    log.warn('Patient attempted to submit response for invalid assigned survey', {
      assignmentId,
      patientId: patient.id,
      surveyId: body.surveyId,
    });
    throw new NotFoundError('Survey was not assigned to the patient');
  }

  const responseRecord = await req.store.sequelize.transaction(async () => {
    const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type, settings);
    const { locationId, departmentId, ...payload } = body;
    const updatedBody = {
      patientId: patient.id,
      locationId: locationId || (await getDefaultId('location')),
      departmentId: departmentId || (await getDefaultId('department')),
      userId: SYSTEM_USER_UUID,
      // facilityId, // TODO: add to form assignment ?
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
