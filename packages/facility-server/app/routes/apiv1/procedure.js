import express from 'express';
import { InvalidOperationError } from '@tamanu/shared/errors';
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

const createNewProcedure = async (requestBody, models) => {
  const { assistantClinicianIds, ...procedureData } = requestBody;

  const procedure = await models.Procedure.create(procedureData);

  // Handle assistant clinician IDs if provided
  if (assistantClinicianIds && assistantClinicianIds.length > 0) {
    const assistantClinicians = assistantClinicianIds.map(userId => ({
      procedureId: procedure.id,
      userId,
    }));
    await models.ProcedureAssistantClinician.bulkCreate(assistantClinicians);
  }

  return procedure;
};

const updateProcedure = async (procedure, requestBody, models) => {
  if (procedure.deletedAt) {
    throw new InvalidOperationError(`Cannot update deleted object, you need to restore it first`);
  }
  if (Object.prototype.hasOwnProperty.call(requestBody, 'deletedAt')) {
    throw new InvalidOperationError('Cannot update deletedAt field');
  }

  const { assistantClinicianIds, ...updateData } = requestBody;

  const updatedProcedure = await procedure.update(updateData);

  // Handle assistant clinician IDs if provided
  if (assistantClinicianIds) {
    const existingAssistants = await models.ProcedureAssistantClinician.findAll({
      where: { procedureId: procedure.id },
    });

    const existingUserIds = existingAssistants.map(assistant => assistant.userId);
    const userIdsToAdd = assistantClinicianIds.filter(userId => !existingUserIds.includes(userId));
    const userIdsToRemove = existingUserIds.filter(
      userId => !assistantClinicianIds.includes(userId),
    );

    // Remove assistant clinicians that are no longer needed
    if (userIdsToRemove.length > 0) {
      await models.ProcedureAssistantClinician.destroy({
        where: {
          procedureId: procedure.id,
          userId: userIdsToRemove,
        },
      });
    }

    if (userIdsToAdd.length > 0) {
      const newAssistantClinicians = userIdsToAdd.map(userId => ({
        procedureId: procedure.id,
        userId,
      }));
      await models.ProcedureAssistantClinician.bulkCreate(newAssistantClinicians);
    }
  }

  return updatedProcedure;
};

procedure.post('/:id?', async (req, res) => {
  const { models, params } = req;
  req.checkPermission('create', 'Procedure');

  let procedure = await models.Procedure.findByPk(params.id);
  if (procedure) {
    procedure = await updateProcedure(procedure, req.body, models);
  } else {
    procedure = await createNewProcedure(req.body, models);
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
