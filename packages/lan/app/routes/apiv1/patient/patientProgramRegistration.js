import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';
import { DELETION_STATUSES } from '@tamanu/constants';

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
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { db, models, params, body } = req;
    const { patientId } = params;
    const { programRegistryId } = body;

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

    // Run in a transaction so it either fails or succeeds together
    const [registration, conditions] = await db.transaction(async () => {
      return Promise.all([
        models.PatientProgramRegistration.create({
          patientId,
          programRegistryId,
          ...registrationData,
        }),
        models.PatientProgramRegistrationCondition.bulkCreate(
          conditionIds.map(conditionId => ({
            patientId,
            programRegistryId,
            clinicianId: registrationData.clinicianId,
            date: registrationData.date,
            programRegistryConditionId: conditionId,
          })),
        ),
      ]);
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...registration.get({ plain: true }),
      conditions,
    };

    res.send(responseObject);
  }),
);

patientProgramRegistration.delete(
  '/:patientId/programRegistration/:programRegistryId/condition/:conditionId',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId, conditionId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry', { id: programRegistryId });
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('delete', 'PatientProgramRegistrationCondition', { programRegistryId });
    const existingCondition = await models.PatientProgramRegistrationCondition.findOne({
      where: {
        programRegistryId,
        patientId,
        programRegistryConditionId: conditionId,
      },
    });
    if (!existingCondition) throw new NotFoundError();

    const condition = await existingCondition.update({
      deletionStatus: DELETION_STATUSES.DELETED,
      deletionClinicianId: body.deletionClinicianId,
      deletionDate: body.deletionDate,
    });

    res.send(condition);
  }),
);
