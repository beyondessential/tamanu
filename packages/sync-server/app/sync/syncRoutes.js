import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidParameterError, NotFoundError } from 'shared/errors';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

const syncManager = new CentralSyncManager();

export const syncRoutes = express.Router();

syncRoutes.post(
  '/pull',
  asyncHandler(async (req, res) => {
    const { query } = req;
    const { since } = query;
    if (!since) {
      throw new Error('Must provide "since" when starting a sync session, even if it is 0');
    }
    const { sessionId, count } = await syncManager.startOutgoingSession(parseInt(since, 10));
    res.send({ sessionId, count });
  }),
);

syncRoutes.post(
  '/push',
  asyncHandler(async (req, res) => {
    const { sessionId } = await syncManager.startIncomingSession();
    res.send({ sessionId });
  }),
);

syncRoutes.get(
  '/pull/:sessionId',
  asyncHandler(async (req, res) => {
    const { query, params } = req;
    const { sessionId } = params;
    const { offset = '0', limit = '100' } = query;
    const changes = await syncManager.getOutgoingChanges(sessionId, {
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
    });
    log.info(`GET /pull : returned ${changes.length} changes`);
    res.send(changes);
  }),
);

syncRoutes.post(
  '/push/:sessionId',
  asyncHandler(async (req, res) => {
    const { params, body: changes } = req;
    const { sessionId } = params;

    await syncManager.addIncomingChanges(sessionId, changes);
    log.info(`POST to ${sessionId} : ${changes.length} records`);
    res.send({});
  }),
);

syncRoutes.delete(
  '/pu(sl)(hl)/:sessionId', // match pull and push with same handler, for ending sync session
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { sessionId } = params;
    await syncManager.endSession(sessionId);
    res.send({});
  }),
);
