import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError, InvalidOperationError } from '@tamanu/errors';
import { findRouteObject } from '@tamanu/shared/utils/crudHelpers';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { createSurveyResponse } from './surveyResponse';

export const procedure = express.Router();

procedure.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { ProcedureAssistantClinician } = models;
    const procedure = await findRouteObject(req, 'Procedure'); // permission check happens internally

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
  }),
);

procedure.post(
  '/surveyResponse',
  asyncHandler(async (req, res) => {
    const {
      models,
      body: { procedureId, procedureTypeId },
    } = req;
    req.checkPermission('create', 'Procedure');

    const responseRecord = await req.db.transaction(async () => {
      const newSurveyResponse = await createSurveyResponse(req);
      let procedure;

      if (procedureId) {
        procedure = await models.Procedure.findByPk(procedureId);

        if (!procedure) {
          throw new NotFoundError('Procedure not found.');
        }
      } else {
        procedure = await models.Procedure.create({
          completed: false,
          date: getCurrentDateTimeString(),
          encounterId: newSurveyResponse.encounterId,
          procedureTypeId,
        });
      }

      return models.ProcedureSurveyResponse.create({
        surveyResponseId: newSurveyResponse.id,
        procedureId: procedure.id,
      });
    });

    res.send(responseRecord);
  }),
);

procedure.post(
  '/',
  asyncHandler(async (req, res) => {
    const { models, body } = req;
    req.checkPermission('create', 'Procedure');

    const { assistantClinicianIds, ...procedureData } = body;

    const procedure = await models.Procedure.create(procedureData);

    // Handle assistant clinician IDs if provided
    if (assistantClinicianIds && assistantClinicianIds.length > 0) {
      const assistantClinicians = assistantClinicianIds.map(userId => ({
        procedureId: procedure.id,
        userId,
      }));
      await models.ProcedureAssistantClinician.bulkCreate(assistantClinicians);
    }

    res.send(procedure);
  }),
);

procedure.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    req.checkPermission('create', 'Procedure');

    const procedure = await models.Procedure.findByPk(params.id);

    if (procedure.deletedAt) {
      throw new InvalidOperationError(`Cannot update deleted object, you need to restore it first`);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'deletedAt')) {
      throw new InvalidOperationError('Cannot update deletedAt field');
    }

    const { assistantClinicianIds, ...updateData } = body;

    const updatedProcedure = await procedure.update(updateData);

    // Handle assistant clinician IDs if provided
    if (assistantClinicianIds) {
      const existingAssistants = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: procedure.id },
      });

      const existingUserIds = existingAssistants.map(assistant => assistant.userId);
      const userIdsToAdd = assistantClinicianIds.filter(
        userId => !existingUserIds.includes(userId),
      );
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

    res.send(updatedProcedure);
  }),
);

// spec: PROC#what-is-deleted
procedure.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('delete', 'Procedure');

    const procedure = await models.Procedure.findByPk(params.id);
    if (!procedure) {
      throw new NotFoundError(`Cannot find procedure with id ${params.id}`);
    }

    await req.db.transaction(async () => {
      const procedureSurveyResponses = await models.ProcedureSurveyResponse.findAll({
        where: { procedureId: procedure.id },
        attributes: ['surveyResponseId'],
      });
      const surveyResponseIds = procedureSurveyResponses.map(link => link.surveyResponseId);

      // Deleting the survey responses themselves (not just the links) keeps them out of the
      // patient and encounter forms tables, and cascades to their answers
      await models.SurveyResponse.destroy({ where: { id: { [Op.in]: surveyResponseIds } } });
      await models.ProcedureSurveyResponse.destroy({ where: { procedureId: procedure.id } });
      await models.ProcedureAssistantClinician.destroy({ where: { procedureId: procedure.id } });

      // Removes the automatically added invoice item via the afterDestroy hook
      await procedure.destroy();
    });

    res.send({ message: 'Procedure deleted successfully' });
  }),
);
