import asyncHandler from 'express-async-handler';

import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { PATIENT_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { PatientSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';

export const getOutstandingForms = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const outstandingForms = await models.PatientSurveyAssignment.findAll({
    where: {
      patientId: patient.id,
      status: PATIENT_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
    },
    attributes: getAttributesFromSchema(PatientSurveyAssignmentSchema),
    include: [
      {
        model: models.Survey,
        attributes: getAttributesFromSchema(PatientSurveyAssignmentSchema.shape.survey),
        as: 'survey',
      },
      {
        model: models.User,
        attributes: getAttributesFromSchema(PatientSurveyAssignmentSchema.shape.assignedBy),
        as: 'assignedBy',
      },
    ],
  });

  return res.send({
    data: outstandingForms.map(form => PatientSurveyAssignmentSchema.parse(form.forResponse())),
  });
});
