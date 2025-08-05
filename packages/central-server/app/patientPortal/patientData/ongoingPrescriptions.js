import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { OngoingPrescriptionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { getAttributesFromSchema } from '../../utils/schemaUtils';

export const getOngoingPrescriptions = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const prescriptions = await models.Prescription.findAll({
    attributes: getAttributesFromSchema(OngoingPrescriptionSchema),
    where: {
      discontinued: { [Op.not]: true },
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

  res.send({
    data: prescriptions.map(prescription =>
      OngoingPrescriptionSchema.parse(prescription.forResponse()),
    ),
  });
});
