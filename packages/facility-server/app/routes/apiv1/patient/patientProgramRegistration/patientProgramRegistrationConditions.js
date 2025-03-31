import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';
import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { validatePatientProgramRegistrationRequest } from './utils';

export const patientProgramRegistrationConditions = express.Router();

patientProgramRegistrationConditions.post(
  '/:patientId/programRegistration/:programRegistryId/condition',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId } = params;

    await validatePatientProgramRegistrationRequest(req, patientId, programRegistryId);

    req.checkPermission('read', 'PatientProgramRegistrationCondition');
    const conditionExists = await models.PatientProgramRegistrationCondition.count({
      where: {
        programRegistryId,
        patientId,
        programRegistryConditionId: body.programRegistryConditionId,
      },
    });
    if (conditionExists) {
      throw new ValidationError("Can't create a duplicate condition for the same patient");
    }

    req.checkPermission('create', 'PatientProgramRegistrationCondition');
    const condition = await models.PatientProgramRegistrationCondition.create({
      patientId,
      programRegistryId,
      ...body,
    });

    res.send(condition);
  }),
);

patientProgramRegistrationConditions.put(
  '/:patientId/programRegistration/:programRegistryId/condition/:conditionId',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { conditionId } = params;

    req.checkPermission('read', 'PatientProgramRegistrationCondition');
    req.checkPermission('write', 'PatientProgramRegistrationCondition');

    const existingCondition = await models.PatientProgramRegistrationCondition.findOne({
      where: {
        id: conditionId,
      },
    });
    if (!existingCondition) {
      throw new NotFoundError('Patient program registration condition not found');
    }
    const updatedCondition = await existingCondition.update(body);
    res.send(updatedCondition);
  }),
);

patientProgramRegistrationConditions.get(
  '/programRegistration/:programRegistrationId/condition',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { programRegistrationId } = params;
    const { PatientProgramRegistrationCondition } = models;

    // req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistrationCondition');

    const history = await PatientProgramRegistrationCondition.findAll({
      where: {
        patientProgramRegistrationId: programRegistrationId,
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

patientProgramRegistrationConditions.delete(
  '/:patientId/programRegistration/:programRegistryId/condition/:conditionId',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { conditionId, patientId, programRegistryId } = params;

    await validatePatientProgramRegistrationRequest(req, patientId, programRegistryId);

    req.checkPermission('delete', 'PatientProgramRegistrationCondition');
    const existingCondition = await models.PatientProgramRegistrationCondition.findOne({
      where: {
        id: conditionId,
      },
    });
    if (!existingCondition) throw new NotFoundError();
    const condition = await existingCondition.update({
      deletionClinicianId: req.user.id,
      deletionDate: query.deletionDate,
    });
    await condition.destroy();
    res.send(condition);
  }),
);
