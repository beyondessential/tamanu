import asyncHandler from 'express-async-handler';

export const getVaccinations = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const vaccinations = await models.PatientVaccination.findAll({
    where: { patientId: patient.id },
  });
});
