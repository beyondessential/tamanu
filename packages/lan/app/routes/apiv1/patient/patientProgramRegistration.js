import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { DELETION_STATUSES } from '@tamanu/constants';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
      params.patientId,
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

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistration } = models;

    req.checkPermission('read', 'PatientProgramRegistration', { patientId, programRegistryId });

    const registration = await PatientProgramRegistration.findOne({
      where: {
        patientId,
        programRegistryId,
      },
      include: PatientProgramRegistration.getFullReferenceAssociations(),
      order: [['updatedAt', 'DESC']],
    });

    if (!registration) {
      throw new NotFoundError();
    }

    res.send(registration);
  }),
);

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId/history$',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistration } = models;

    req.checkPermission('list', 'PatientProgramRegistration', { patientId, programRegistryId });

    const history = await PatientProgramRegistration.findAll({
      where: {
        patientId,
        programRegistryId,
        clinicalStatusUpdatedAt: { [Op.ne]: null },
      },
      include: PatientProgramRegistration.getListReferenceAssociations(),
      order: [['clinicalStatusUpdatedAt', 'DESC']],
    });

    res.send({
      count: history.length,
      data: history,
    });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration/:programRegistryId/condition',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', 'ProgramRegistry', { id: programRegistryId });
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('read', 'PatientProgramRegistrationCondition', { programRegistryId });
    const conditionExists = await models.PatientProgramRegistrationCondition.count({
      where: {
        programRegistryId,
        patientId,
        programRegistryConditionId: body.programRegistryConditionId,
        deletionStatus: null,
      },
    });
    if (conditionExists) {
      throw new ValidationError("Can't create a duplicate condition for the same patient");
    }

    req.checkPermission('create', 'PatientProgramRegistrationCondition', { programRegistryId });
    const condition = await models.PatientProgramRegistrationCondition.create({
      patientId,
      programRegistryId,
      ...body,
    });

    res.send(condition);
  }),
);

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId/condition',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistrationCondition } = models;

    req.checkPermission('list', 'PatientProgramRegistrationCondition', {
      patientId,
      programRegistryId,
    });

    const history = await PatientProgramRegistrationCondition.findAll({
      where: {
        patientId,
        programRegistryId,
        deletionStatus: null,
      },
      include: PatientProgramRegistrationCondition.getFullReferenceAssociations(),
      order: [['date', 'DESC']],
    });

    res.send({
      count: history.length,
      data: history,
    });
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
        id: conditionId,
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
