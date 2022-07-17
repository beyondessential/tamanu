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
    const sessionIndex = await syncManager.startSession(store);
    res.send(sessionIndex);
  }),
);

// set the "sinceSessionIndex" for a pull session
syncRoutes.post(
  '/:sessionIndex/pullFilter',
  asyncHandler(async (req, res) => {
    const { params, body, store } = req;
    const { sinceSessionIndex: sinceSessionIndexString } = body;
    const sinceSessionIndex = parseInt(sinceSessionIndexString, 10);
    if (isNaN(sinceSessionIndex)) {
      throw new Error(
        'Must provide "sinceSessionIndex" when creating a pull filter, even if it is 0',
      );
    }
    const count = await syncManager.setPullFilter(
      params.sessionIndex,
      { sinceSessionIndex },
      store,
    );
    res.json(count);
  }),
);

// pull changes down to facility
syncRoutes.get(
  '/:sessionIndex/pull',
  asyncHandler(async (req, res) => {
    const { query, params } = req;
    const { sessionIndex } = params;
    const { offset = '0', limit = '100' } = query;
    const changes = await syncManager.getOutgoingChanges(sessionIndex, {
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
    });
    log.info(`GET /pull : returned ${changes.length} changes`);
    res.json(changes);
  }),
);

// push changes in from facility
syncRoutes.post(
  '/:sessionIndex/push',
  asyncHandler(async (req, res) => {
    const { params, body: changes, query, store } = req;
    const { sessionIndex } = params;

    await syncManager.addIncomingChanges(sessionIndex, changes, query, store);
    log.info(`POST to ${sessionIndex} : ${changes.length} records`);
    res.json({});
  }),
);

// end session
syncRoutes.delete(
  '/:sessionIndex',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { sessionIndex } = params;
    await syncManager.endSession(sessionIndex);
    res.json({});
  }),
);
