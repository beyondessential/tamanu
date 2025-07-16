import asyncHandler from 'express-async-handler';

import { OngoingConditionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';

import { getAttributesFromSchema } from '../../utils/schemaUtils';

export const getOngoingConditions = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const ongoingConditions = await models.PatientCondition.findAll({
    where: {
      patientId: patient.id,
    },
    attributes: getAttributesFromSchema(OngoingConditionSchema),
    include: [
      {
        model: models.ReferenceData,
        as: 'condition',
        attributes: getAttributesFromSchema(OngoingConditionSchema.shape.condition),
      },
    ],
  });

  res.send({
    data: ongoingConditions.map(condition => OngoingConditionSchema.parse(condition.forResponse())),
  });
});
