import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

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
    const { models, params, body } = req;
    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(params.id);
    if (!patient) throw new NotFoundError();

    req.checkPermission('create', 'PatientSecondaryId');
    const secondaryId = await models.PatientSecondaryId.create({
      value: req.body.value,
      visibilityStatus: req.body.visibilityStatus,
      typeId: req.body.typeId,
      patientId: params.id,
    });

    res.send(secondaryId);
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
