import { Op } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

export const patientProgramRegistration = express.Router();

const GET_MOST_RECENT_REGISTRATIONS_QUERY = `
  (
    SELECT id
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
      FROM patient_program_registrations
    ) n
    WHERE n.row_num = 1
  )
`;

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
    const { models, params, body, db } = req;
    const { patientId, programRegistryId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry');
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry');
    const existingRegistration = await models.PatientProgramRegistration.findOne({
      attributes: {
        // We don't want to override the defaults for the new record.
        exclude: ['id', 'updatedAt', 'updatedAtSyncTick'],
      },
      where: {
        id: { [Op.in]: db.literal(GET_MOST_RECENT_REGISTRATIONS_QUERY) },
        programRegistryId,
        patientId,
      },
      raw: true,
    });

    if (existingRegistration) {
      req.checkPermission('write', 'PatientProgramRegistration');
    } else {
      req.checkPermission('create', 'PatientProgramRegistration');
    }

    const registration = await models.PatientProgramRegistration.create({
      patientId,
      programRegistryId,
      ...(existingRegistration ?? {}),
      ...body,
    });

    res.send(registration);
  }),
);
