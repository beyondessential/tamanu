import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:id/patientProgramRegistration',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { facilityId } = query;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.findAll({
      where: {
        patientId: params.id,
      },
    });

    const recordData = registrationData ? registrationData.toJSON() : {};

    res.send({ ...recordData });
  }),
);

patientProgramRegistration.post(
  '/:id/patientProgramRegistration',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { facilityId } = query;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.findOne({
      where: { patientId: params.id },
    });

    const recordData = registrationData ? registrationData.toJSON() : {};

    res.send({ ...recordData });
  }),
);
