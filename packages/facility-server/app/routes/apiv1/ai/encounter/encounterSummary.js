import express from 'express';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { NotFoundError } from '@tamanu/errors';
import { regenerateAiEncounterSummary } from '../../../../services/encounterSummary';

const MAX_SUMMARY_CONTENT_LENGTH = 10000;

const updateBodySchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('edited'),
      content: z.string().min(1).max(MAX_SUMMARY_CONTENT_LENGTH),
    })
    .strict(),
  z
    .object({
      status: z.literal('discarded'),
    })
    .strict(),
]);

export const encounterSummaryRoute = express.Router();

encounterSummaryRoute.get(
  '/:encounterId',
  asyncHandler(async (req, res) => {
    const { encounterId } = req.params;
    req.checkPermission('read', 'EncounterSummary');

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

    req.checkPermission('create', 'EncounterSummary');

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
    req.checkPermission('write', 'EncounterSummary');

    const { AiDocument } = req.models;
    // ai_documents has a composite primary key, so look up by the unique generated id
    const doc = await AiDocument.findOne({ where: { id: req.params.id } });
    if (!doc) {
      throw new NotFoundError('AI document not found');
    }

    const parsed = updateBodySchema.parse(req.body);
    const updateFields =
      parsed.status === 'discarded'
        ? { status: 'discarded', content: null, source: 'human' }
        : { status: 'edited', content: parsed.content, source: 'human' };
    await doc.update(updateFields);

    res.send(doc.forResponse());
  }),
);
