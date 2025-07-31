import express from 'express';
import { InvalidOperationError, NotFoundError } from '@tamanu/shared/errors';
import { findRouteObject } from '@tamanu/shared/utils/crudHelpers';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { createSurveyResponse } from './surveyResponse';

export const procedure = express.Router();

procedure.get('/:id', async (req, res) => {
  const { models } = req;
  const { ProcedureAssistantClinician } = models;
  const procedure = await findRouteObject(req, 'Procedure');

  const assistantClinicians = await ProcedureAssistantClinician.findAll({
    where: { procedureId: procedure.id },
  });

  const assistantClinicianIds = assistantClinicians.map(assistant => assistant.userId);

  // Add assistant clinician IDs to the response
  const procedureData = {
    ...procedure.toJSON(),
    assistantClinicianIds,
  };

  res.send(procedureData);
});

procedure.put('/:id', async (req, res) => {
  const { models, params } = req;
  const { ProcedureAssistantClinician, Procedure } = models;
  req.checkPermission('read', 'Procedure');
  const procedure = await Procedure.findByPk(params.id);
  if (!procedure) {
    throw new NotFoundError();
  }
  if (procedure.deletedAt) {
    throw new InvalidOperationError(
      `Cannot update deleted object with id (${params.id}), you need to restore it first`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'deletedAt')) {
    throw new InvalidOperationError('Cannot update deletedAt field');
  }
  req.checkPermission('write', procedure);

  const { assistantClinicianIds, ...updateData } = req.body;

  await procedure.update(updateData);

  // Handle assistant clinician IDs if provided
  if (assistantClinicianIds) {
    const existingAssistants = await ProcedureAssistantClinician.findAll({
      where: { procedureId: procedure.id },
    });

    const existingUserIds = existingAssistants.map(assistant => assistant.userId);

    // Find which user IDs to add (new ones)
    const userIdsToAdd = assistantClinicianIds.filter(userId => !existingUserIds.includes(userId));

    // Find which user IDs to remove (no longer in the list)
    const userIdsToRemove = existingUserIds.filter(
      userId => !assistantClinicianIds.includes(userId),
    );

    // Remove assistant clinicians that are no longer needed
    if (userIdsToRemove.length > 0) {
      await ProcedureAssistantClinician.destroy({
        where: {
          procedureId: procedure.id,
          userId: userIdsToRemove,
        },
      });
    }

    // Add new assistant clinicians
    if (userIdsToAdd.length > 0) {
      const newAssistantClinicians = userIdsToAdd.map(userId => ({
        procedureId: procedure.id,
        userId,
      }));
      await ProcedureAssistantClinician.bulkCreate(newAssistantClinicians);
    }
  }

  res.send(procedure);
});

procedure.post('/', async (req, res) => {
  const { models } = req;
  const { ProcedureAssistantClinician } = models;
  req.checkPermission('create', 'Procedure');

  const existingProcedure = await models.Procedure.findByPk(req.body.id, {
    paranoid: false,
  });
  if (existingProcedure) {
    throw new InvalidOperationError(
      `Cannot create object with id (${req.body.id}), it already exists`,
    );
  }

  const { assistantClinicianIds, ...procedureData } = req.body;

  const procedure = await models.Procedure.create(procedureData);

  // Handle assistant clinician IDs if provided
  if (assistantClinicianIds && assistantClinicianIds.length > 0) {
    const assistantClinicians = assistantClinicianIds.map(userId => ({
      procedureId: procedure.id,
      userId,
    }));
    await ProcedureAssistantClinician.bulkCreate(assistantClinicians);
  }

  res.send(procedure);
});

procedure.post('/surveyResponse', async (req, res) => {
  const {
    models,
    body: { procedureId },
  } = req;

  const responseRecord = await req.db.transaction(async () => {
    const newSurveyResponse = await createSurveyResponse(req, res);

    if (procedureId) {
      // Find or create the Procedure based on procedureId
      const procedure = await models.Procedure.findOrCreate({
        where: { id: procedureId },
        defaults: {
          // Add any default values needed for creating a new Procedure
          // These are just examples - adjust based on your requirements
          completed: false,
          date: getCurrentDateTimeString(),
        },
      });

      await models.ProcedureSurveyResponse.create({
        surveyResponseId: newSurveyResponse.id,
        procedureId: procedure[0].id, // procedure[0] is the found/created instance
      });
    }
    return newSurveyResponse;
  });

  res.send(responseRecord);
});
