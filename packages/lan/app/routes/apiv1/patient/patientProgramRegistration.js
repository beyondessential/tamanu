import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:id/programRegistration',
  asyncHandler(async (req, res) => {
    const { params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
      params.id,
    );

    res.send({ data: registrationData });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration/:programRegistryId',
  asyncHandler(async (req, res) => {
    const { db, models, params, body } = req;
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

    const { conditionIds = [], ...registrationData } = body;

    if (conditionIds.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition', { programRegistryId });
    }

    let registration;
    let conditions;
    // Run in a transaction so it either fails or succeeds together
    await db.transaction(async () => {
      registration = await models.PatientProgramRegistration.create({
        patientId,
        programRegistryId,
        ...registrationData,
      });
      conditions = await models.PatientProgramRegistrationCondition.bulkCreate(
        conditionIds.map(conditionId => ({
          patientId,
          programRegistryId,
          clinicianId: registrationData.clinicianId,
          date: registrationData.date,
          programRegistryConditionId: conditionId,
        })),
      );
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...registration.get({ plain: true }),
      conditions,
    };

    res.send(responseObject);
  }),
);
