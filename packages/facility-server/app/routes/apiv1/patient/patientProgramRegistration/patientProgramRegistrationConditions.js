import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/shared/errors';

export const patientProgramRegistrationConditions = express.Router();

patientProgramRegistrationConditions.put(
  '/programRegistrationCondition/:id',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { id } = params;

    req.checkPermission('read', 'PatientProgramRegistrationCondition');
    req.checkPermission('write', 'PatientProgramRegistrationCondition');

    const existingCondition = await models.PatientProgramRegistrationCondition.findOne({
      where: {
        id,
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
    const { PatientProgramRegistrationCondition, PatientProgramRegistration } = models;

    const programRegistration = await PatientProgramRegistration.findByPk(programRegistrationId);
    if (!programRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }
    const { programRegistryId } = programRegistration;
    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
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
