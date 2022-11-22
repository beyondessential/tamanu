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
      const { sessionId, tick } = await syncManager.startSession();
      res.json({ sessionId, tick });
    }),
  );

  // set the since and facilityId for a pull session
  syncRoutes.post(
    '/:sessionId/pullFilter',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { since: sinceString, facilityId, tablesToInclude, isMobile } = body;
      const since = parseInt(sinceString, 10);
      if (isNaN(since)) {
        throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
      }
      const { tick } = await syncManager.setPullFilter(params.sessionId, {
        since,
        facilityId,
        tablesToInclude,
        isMobile,
      });
      res.json({ tick });
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
      const { fromId, limit = '100' } = query;
      const changes = await syncManager.getOutgoingChanges(sessionId, {
        fromId,
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
      const { params, body, query } = req;
      const { sessionId } = params;
      const { changes, tablesToInclude } = body;
      await syncManager.addIncomingChanges(sessionId, changes, query, tablesToInclude);
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
