import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

const syncManager = new CentralSyncManager();

export const syncRoutes = express.Router();

// create new sync session
syncRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    const sessionIndex = await syncManager.startSession(store);
    res.send(sessionIndex);
  }),
);

// set the "fromSessionIndex" for a pull session
syncRoutes.post(
  '/:sessionIndex/pullFilter',
  asyncHandler(async (req, res) => {
    const { params, body, store } = req;
    const { fromSessionIndex: fromSessionIndexString, facilityId } = body;
    const fromSessionIndex = parseInt(fromSessionIndexString, 10);
    if (isNaN(fromSessionIndex)) {
      throw new Error(
        'Must provide "fromSessionIndex" when creating a pull filter, even if it is 0',
      );
    }
    const count = await syncManager.setPullFilter(
      params.sessionIndex,
      { fromSessionIndex, facilityId },
      store,
    );
    res.json(count);
  }),
);

// pull changes down to facility
syncRoutes.get(
  '/:sessionIndex/pull',
  asyncHandler(async (req, res) => {
    const { query, params, store } = req;
    const { sessionIndex } = params;
    const { offset = '', limit = '100' } = query;
    const changes = await syncManager.getOutgoingChanges(store, sessionIndex, {
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
    const { params, store } = req;
    const { sessionIndex } = params;
    await syncManager.endSession(store, sessionIndex);
    res.json({});
  }),
);
