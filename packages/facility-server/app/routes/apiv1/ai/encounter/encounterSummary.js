import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from '@tamanu/errors';
import { regenerateAiEncounterSummary } from '../../../../services/encounterSummary';

export const encounterSummaryRoute = express.Router();

encounterSummaryRoute.get(
  '/:encounterId',
  asyncHandler(async (req, res) => {
    const { encounterId } = req.params;
    req.checkPermission('write', 'Discharge');

    const { AiDocument } = req.models;
    const existing = await AiDocument.findOne({
      where: { recordType: 'Encounter', recordId: encounterId, type: 'discharge' },
      order: [['createdAt', 'DESC']],
    });

    res.send({ aiDocument: existing ? existing.forResponse() : null });
  }),
);

encounterSummaryRoute.post(
  '/:encounterId',
  asyncHandler(async (req, res) => {
    const { encounterId } = req.params;
    const { deviceId } = req;

    req.checkPermission('write', 'Discharge');

    const { Encounter } = req.models;
    const encounterExists = await Encounter.count({ where: { id: encounterId } });
    if (!encounterExists) {
      throw new NotFoundError('Encounter not found');
    }

    const doc = await regenerateAiEncounterSummary({
      encounterId,
      models: req.models,
      db: req.db,
      deviceId,
    });

    res.send(doc.forResponse());
  }),
);

encounterSummaryRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Discharge');

    const { AiDocument } = req.models;
    // ai_documents has a composite primary key, so look up by the unique generated id
    const doc = await AiDocument.findOne({ where: { id: req.params.id } });
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
