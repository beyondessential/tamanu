import asyncHandler from 'express-async-handler';

import { PatientSchema } from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';

export const getPatient = asyncHandler(async (req, res) => {
  const { patient } = req;
  const village = await patient.getVillage();
  res.send({
    data: PatientSchema.parse({ ...patient.forResponse(), village: village?.forResponse() }),
  });
});
