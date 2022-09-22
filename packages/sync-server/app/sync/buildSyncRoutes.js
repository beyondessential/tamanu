import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

export const buildSyncRoutes = ctx => {
  const syncManager = new CentralSyncManager();
  ctx.onClose(() => syncManager.close());
  const syncRoutes = express.Router();

  // create new sync session
  syncRoutes.post(
    '/',
    asyncHandler(async (req, res) => {
      const { store } = req;
      const { sessionId, syncClockTick } = await syncManager.startSession(store);
      res.send({ sessionId, syncClockTick });
    }),
  );

  // set the since and facilityId for a pull session
  syncRoutes.post(
    '/:sessionId/pullFilter',
    asyncHandler(async (req, res) => {
      const { params, body, store } = req;
      const { since: sinceString, facilityId } = body;
      const since = parseInt(sinceString, 10);
      if (isNaN(since)) {
        throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
      }
      const count = await syncManager.setPullFilter(params.sessionId, { since, facilityId }, store);
      res.json(count);
    }),
  );

  // pull changes down to facility
  syncRoutes.get(
    '/:sessionId/pull',
    asyncHandler(async (req, res) => {
      const { query, params, store } = req;
      const { sessionId } = params;
      const { offset = '', limit = '100' } = query;
      const changes = await syncManager.getOutgoingChanges(store, sessionId, {
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
      });
      log.info(`GET /pull : returned ${changes.length} changes`);
      res.json(changes);
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
      res.json({});
    }),
  );

  // end session
  syncRoutes.delete(
    '/:sessionId',
    asyncHandler(async (req, res) => {
      const { params, store } = req;
      const { sessionId } = params;
      await syncManager.endSession(store, sessionId);
      res.json({});
    }),
  );

  return syncRoutes;
};
