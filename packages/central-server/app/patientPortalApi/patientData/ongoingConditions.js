import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { OngoingConditionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';

import { getAttributesFromSchema } from '../../utils/schemaUtils';

export const getOngoingConditions = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const ongoingConditions = await models.PatientCondition.findAll({
    where: {
      patientId: patient.id,
      resolved: { [Op.ne]: true }, // Excluding resolved conditions for now
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

  res.send(
    ongoingConditions.map(condition => OngoingConditionSchema.parse(condition.forResponse())),
  );
});
