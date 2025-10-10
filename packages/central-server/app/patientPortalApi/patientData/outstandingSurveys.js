import asyncHandler from 'express-async-handler';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { PortalSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';

import { getAttributesFromSchema } from '../../utils/schemaUtils';

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

  return res.send(
    outstandingSurveys.map(survey => PortalSurveyAssignmentSchema.parse(survey.forResponse())),
  );
});
