import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { NotFoundError } from '@tamanu/errors';
import { regenerateAiPatientSummary } from '../../../../services/patientSummary';

export const patientSummaryRoute = express.Router();

patientSummaryRoute.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    req.checkPermission('read', 'PatientSummary');

    const { AiDocument, Encounter } = req.models;
    const existing = await AiDocument.findOne({
      where: { recordType: 'Patient', recordId: patientId, summaryType: 'patient' },
    });

    if (!existing) {
      res.send({ aiDocument: null, requiresRegeneration: false });
      return;
    }

    const newActiveEncounterSinceSummary = await Encounter.findOne({
      attributes: ['id'],
      where: {
        patientId,
        endDate: null,
        updatedAtSyncTick: { [Op.gt]: existing.updatedAtSyncTick },
      },
    });

    if (!newActiveEncounterSinceSummary) {
      res.send({ aiDocument: existing.forResponse(), requiresRegeneration: false });
      return;
    }

    res.send({ aiDocument: existing.forResponse(), requiresRegeneration: true });
  }),
);

patientSummaryRoute.post(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { deviceId } = req;

    req.checkPermission('read', 'PatientSummary');

    const { Patient } = req.models;
    const patientExists = await Patient.count({ where: { id: patientId } });
    if (!patientExists) {
      throw new NotFoundError('Patient not found');
    }

    const doc = await regenerateAiPatientSummary({
      patientId,
      models: req.models,
      db: req.db,
      deviceId,
    });

    res.send(doc.forResponse());
  }),
);

patientSummaryRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'PatientSummary');

    const { AiDocument } = req.models;
    const doc = await AiDocument.findByPk(req.params.id);
    if (!doc) {
      throw new NotFoundError('AI document not found');
    }

    const { content, status } = req.body;
    const updateFields = { source: 'human' };
    if (status === 'discarded') {
      updateFields.status = 'discarded';
      updateFields.content = null;
    } else {
      updateFields.status = 'edited';
      updateFields.content = content;
    }
    await doc.update(updateFields);

    res.send(doc.forResponse());
  }),
);
