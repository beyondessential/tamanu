import asyncHandler from 'express-async-handler';
import { PatientWithAdditionalDataSchema } from '@tamanu/shared/schemas/patientPortal';

export const getPatient = asyncHandler(async (req, res) => {
  const { patient } = req;
  const village = await patient.getVillage();
  await req.audit.access({
    recordId: patient.id,
    model: req.models.Patient,
  });
  res.send(
    PatientWithAdditionalDataSchema.parse({
      ...patient.forResponse(),
      village: village?.forResponse(),
    }),
  );
});
