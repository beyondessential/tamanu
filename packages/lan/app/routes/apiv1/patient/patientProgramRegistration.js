import { Op } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';
import { GET_MOST_RECENT_REGISTRATIONS_QUERY } from '@tamanu/shared/models/PatientProgramRegistration';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:id/programRegistration',
  asyncHandler(async (req, res) => {
    const { db, params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.findAll({
      where: {
        id: { [Op.in]: db.literal(GET_MOST_RECENT_REGISTRATIONS_QUERY) },
        patientId: params.id,
      },
      // order: TODO
    });

    res.send({ data: registrationData });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration/:programRegistryId',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry', { id: programRegistryId });
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        programRegistryId,
        patientId,
      },
    });

    if (existingRegistration) {
      req.checkPermission('write', 'PatientProgramRegistration', { programRegistryId });
    } else {
      req.checkPermission('create', 'PatientProgramRegistration', { programRegistryId });
    }

    const registration = await models.PatientProgramRegistration.create({
      patientId,
      programRegistryId,
      ...body,
    });

    res.send(registration);
  }),
);
