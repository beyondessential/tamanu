import asyncHandler from 'express-async-handler';
import { log } from '@tamanu/shared/services/logging';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { PortalSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';

import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { PortalCreateSurveyResponseRequestSchema } from '@tamanu/shared/schemas/patientPortal/requests/createSurveyResponse.schema';
import { NotFoundError } from '@tamanu/shared/errors';

export const getOutstandingForms = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const outstandingForms = await models.PortalSurveyAssignment.findAll({
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
    data: outstandingForms.map(form => PortalSurveyAssignmentSchema.parse(form.forResponse())),
  });
});

export const submitDesignatedFormResponse = asyncHandler(async (req, res) => {
  const { patient, settings, params } = req;
  const { models } = req.store;
  const { designationId } = params;

  // Validate request body with portal-specific schema (no patientId from client)
  const body = PortalCreateSurveyResponseRequestSchema.parse(req.body);

  const assignedForm = await models.PortalSurveyAssignment.findOne({
    where: {
      id: designationId,
      patientId: patient.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      surveyId: body.surveyId,
    },
  });
 
  if (!assignedForm) {
    log.warn('Patient attempted to submit response for invalid designated form', {
      designationId,
      patientId: patient.id,
      surveyId: body.surveyId,
    });
    throw new NotFoundError('Form was not assigned to the patient');
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
    await assignedForm.update({
      surveyResponseId: surveyResponse.id,
      status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
    });

    return surveyResponse;
  });

  return res.send(responseRecord);
});
