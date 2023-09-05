import Sequelize, { Op } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { NotFoundError } from 'shared/errors';

export const patientProgramRegistration = express.Router();

const MOST_RECENT_WHERE_CONDITION_LITERAL = `
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
        id: { [Op.in]: db.literal(MOST_RECENT_WHERE_CONDITION_LITERAL) },
        patientId: params.id,
      },
      // order: TODO
    });
    console.log(registrationData);

    res.send({ data: registrationData });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration/:programId',
  asyncHandler(async (req, res) => {
    const { models, params, body, db } = req;
    const { patientId, programId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry');
    // There should only ever be one current ProgramRegistry per program,
    // but this isn't database enforced
    const programRegistry = await models.ProgramRegistry.findOne({
      where: {
        programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry');
    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        id: { [Op.in]: db.literal(MOST_RECENT_WHERE_CONDITION_LITERAL) },
        programRegistryId: programRegistry.id,
        patientId: patient.id,
      },
    });

    if (existingRegistration) {
      req.checkPermission('write', 'PatientProgramRegistration');
    } else {
      req.checkPermission('create', 'PatientProgramRegistration');
    }

    const registration = await models.PatientProgramRegistration.create({
      patientId,
      programRegistryId: programRegistry.id,
      ...(existingRegistration ?? {}),
      ...body,
    });

    res.send(registration);
  }),
);
