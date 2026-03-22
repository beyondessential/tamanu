import asyncHandler from 'express-async-handler';

import { AllergySchema } from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { getAttributesFromSchema } from '../../utils/schemaUtils';

export const getAllergies = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;
  const allergies = await models.PatientAllergy.findAll({
    where: { patientId: patient.id },
    attributes: getAttributesFromSchema(AllergySchema),
    include: [
      {
        model: models.ReferenceData,
        as: 'allergy',
        attributes: getAttributesFromSchema(AllergySchema.shape.allergy),
      },
      {
        model: models.ReferenceData,
        as: 'reaction',
        attributes: getAttributesFromSchema(AllergySchema.shape.reaction),
      },
    ],
  });

  res.send(allergies.map(allergy => AllergySchema.parse(allergy.forResponse())));
});
