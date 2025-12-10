import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/errors';
import { camelCaseProperties } from '@tamanu/utils/camelCaseProperties';
import { Op } from 'sequelize';

export const patientProgramRegistrationConditions = express.Router();

patientProgramRegistrationConditions.put(
  '/condition/:id',
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
  '/:programRegistrationId/condition',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { programRegistrationId } = params;
    const { PatientProgramRegistrationCondition, PatientProgramRegistration, ChangeLog, User } =
      models;

    const programRegistration = await PatientProgramRegistration.findOne({
      where: { id: programRegistrationId },
    });
    if (!programRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }
    const { programRegistryId } = programRegistration;
    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistrationCondition');

    const conditions = await PatientProgramRegistrationCondition.findAll({
      where: {
        patientProgramRegistrationId: programRegistrationId,
      },
      include: PatientProgramRegistrationCondition.getFullReferenceAssociations(),
      order: [['date', 'DESC']],
    });

    // Get all condition IDs
    const conditionIds = conditions.map((c) => c.id);

    // Fetch change history for all conditions
    const changes = await ChangeLog.findAll({
      where: {
        tableName: 'patient_program_registration_conditions',
        recordId: {
          [Op.in]: conditionIds,
        },
        migrationContext: null,
      },
      include: [
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'displayName'],
        },
      ],
      order: [['loggedAt', 'DESC']],
    });

    // Create a map of condition ID to its change history
    const conditionHistoryMap = changes.reduce((acc, change) => {
      const conditionId = change.recordId;
      if (!acc[conditionId]) {
        acc[conditionId] = [];
      }
      acc[conditionId].push({
        id: change.id,
        date: change.loggedAt,
        data: camelCaseProperties(change.recordData),
        clinician: change.updatedByUser,
      });
      return acc;
    }, {});

    // Add history to each condition
    const conditionsWithHistory = conditions.map((condition) => ({
      ...condition.toJSON(),
      history: conditionHistoryMap[condition.id] || [],
    }));

    res.send({
      count: conditionsWithHistory.length,
      data: conditionsWithHistory,
    });
  }),
);
