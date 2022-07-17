import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

const syncManager = new CentralSyncManager();

export const syncRoutes = express.Router();

syncRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    const syncIndex = await syncManager.startSession(store);
    res.send(syncIndex);
  }),
);

// set the cursor for a pull session
syncRoutes.post(
  '/:sessionId/pullFilter',
  asyncHandler(async (req, res) => {
    const { params, body, store } = req;
    const { since } = body;
    if (!Number.isInteger(since)) {
      throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
    }
    const count = await syncManager.setPullFilter(
      params.sessionId,
      { since: parseInt(since, 10) },
      store,
    );
    res.send(count);
  }),
);

// pull changes down to facility
syncRoutes.get(
  '/:sessionId/pull',
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

// push changes in from facility
syncRoutes.post(
  '/:sessionId/push',
  asyncHandler(async (req, res) => {
    const { params, body: changes, query, store } = req;
    const { sessionId } = params;

    await syncManager.addIncomingChanges(sessionId, changes, query, store);
    log.info(`POST to ${sessionId} : ${changes.length} records`);
    res.send({});
  }),
);

// end session
syncRoutes.delete(
  '/:sessionId',
  asyncHandler(async (req, res) => {
    const { params, store } = req;
    const { sessionId } = params;
    await syncManager.endSession(store.sequelize, store.models, sessionId);
    res.send({});
  }),
);
