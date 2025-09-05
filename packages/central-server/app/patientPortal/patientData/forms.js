import asyncHandler from 'express-async-handler';

import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import { PortalSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';

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

export const submitForm = asyncHandler(async (req, res) => {
  const { patient, body, settings } = req;
  const { models } = req.store;
  const responseRecord = await req.db.transaction(async () => {
    const getDefaultId = async type =>
      models.SurveyResponseAnswer.getDefaultId(type, settings);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      userId: SYSTEM_USER_UUID,
      // facilityId, // TODO: add to form assignment
      ...body,
    };
    return await models.SurveyResponse.createWithAnswers(updatedBody);
  });

  return res.send(responseRecord);
});