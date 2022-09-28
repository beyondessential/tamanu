import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

export const buildSyncRoutes = ctx => {
  const syncManager = new CentralSyncManager(ctx);
  const syncRoutes = express.Router();

  // create new sync session
  syncRoutes.post(
    '/',
    asyncHandler(async (req, res) => {
      const { facilityId } = req.query;
      const sessionId = await syncManager.startSession(facilityId);
      res.json(sessionId);
    }),
  );

  // tick global clock
  syncRoutes.post(
    '/tick',
    asyncHandler(async (req, res) => {
      const { tick } = await syncManager.tickTockGlobalClock();
      res.json(tick);
    }),
  );

  // set the since and facilityId for a pull session
  syncRoutes.post(
    '/:sessionId/pullFilter',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { since: sinceString, facilityId } = body;
      const since = parseInt(sinceString, 10);
      if (isNaN(since)) {
        throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
      }
      // we don't await the setPullFilter function before responding, as it takes a long time
      // instead, the client will poll the pull count endpoint until it responds with a valid count
      syncManager.setPullFilter(params.sessionId, {
        since,
        facilityId,
      });
      res.json(true);
    }),
  );

  // count the outgoing changes for a session, or return null if it is not finished snapshotting
  syncRoutes.get(
    '/:sessionId/pull/count',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const count = await syncManager.fetchPullCount(params.sessionId);
      res.json(count);
    }),
  );

  // pull changes down to facility
  syncRoutes.get(
    '/:sessionId/pull',
    asyncHandler(async (req, res) => {
      const { query, params } = req;
      const { sessionId } = params;
      const { offset = '', limit = '100' } = query;
      const changes = await syncManager.getOutgoingChanges(sessionId, {
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
      const { params, body: changes, query } = req;
      const { sessionId } = params;

      await syncManager.addIncomingChanges(sessionId, changes, query);
      log.info(`POST to ${sessionId} : ${changes.length} records`);
      res.json({});
    }),
  );

  // end session
  syncRoutes.delete(
    '/:sessionId',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      await syncManager.endSession(sessionId);
      res.json({});
    }),
  );

  return syncRoutes;
};
