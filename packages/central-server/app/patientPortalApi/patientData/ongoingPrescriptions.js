import asyncHandler from 'express-async-handler';

import { OngoingPrescriptionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { Op } from 'sequelize';

export const getOngoingPrescriptions = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  // Filter prescriptions to only include those that are ongoing for the target patient.
  // This requires joining with the PatientOngoingPrescription table for the filter condition,
  // but since no fields from that table are needed in the result, we pass an empty attributes array.
  const prescriptions = await models.Prescription.findAll({
    attributes: getAttributesFromSchema(OngoingPrescriptionSchema),
    where: {
      discontinued: {
        [Op.not]: true,
      },
    },
    include: [
      {
        model: models.PatientOngoingPrescription,
        as: 'patientOngoingPrescription',
        where: { patientId: patient.id },
        attributes: [],
      },
      {
        model: models.ReferenceData,
        as: 'medication',
        attributes: getAttributesFromSchema(OngoingPrescriptionSchema.shape.medication),
      },
      {
        model: models.User,
        as: 'prescriber',
        attributes: getAttributesFromSchema(OngoingPrescriptionSchema.shape.prescriber),
      },
    ],
  });

  res.send(
    prescriptions.map(prescription => OngoingPrescriptionSchema.parse(prescription.forResponse())),
  );
});
