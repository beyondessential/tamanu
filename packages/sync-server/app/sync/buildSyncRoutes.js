import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';
import { CentralSyncManager } from './CentralSyncManager';

export const buildSyncRoutes = ctx => {
  const syncManager = new CentralSyncManager(ctx);
  const syncRoutes = express.Router();

  // create new sync session or join/update the queue for one
  syncRoutes.post(
    '/',
    asyncHandler(async (req, res) => {
      const { SyncQueuedDevice } = req.models;

      // update our position in the queue and check if we're at the front of it
      const queueRecord = await SyncQueuedDevice.checkSyncRequest({
        lastSyncedTick: 0,
        urgent: false,
        ...req.body,
      });
      log.info('Dummy queue result:', { queueRecord });

      // if we're not at the front of the queue, we're waiting
      if (!queueRecord) {
        res.send({
          status: 'waitingInQueue',
        });
        return;
      }

      // we're at the front of the queue, but if the previous device's sync is still
      // underway we need to wait for that
      const isSyncUnderway = await syncManager.getIsSyncUnderway();
      if (isSyncUnderway) {
        res.send({
          status: 'activeSync',
        });
        return;
      }

      // remove our place in the queue before starting sync
      // (if the resulting sync has an error, we'll be knocked to the back of the queue
      // but that's fine. It will leave some room for non-errored devices to sync, and
      // our requests will get priority once our error resolves as we'll have an older
      // lastSyncedTick)
      queueRecord.destroy();

      const { user, body } = req;
      const { facilityId, deviceId } = body;
      const { sessionId, tick } = await syncManager.startSession({
        userId: user.id,
        deviceId,
        facilityId,
      });
      res.json({ sessionId, tick });
    }),
  );

  // fetch if the session is ready to start syncing
  syncRoutes.get(
    '/:sessionId/ready',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const ready = await syncManager.checkSessionReady(sessionId);
      res.json(ready);
    }),
  );

  // fetch sync metadata
  syncRoutes.get(
    '/:sessionId/metadata',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { startedAtTick } = await syncManager.fetchSyncMetadata(params.sessionId);
      res.json({ startedAtTick });
    }),
  );

  // set the since and facilityId for a pull session
  syncRoutes.post(
    '/:sessionId/pull/initiate',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const {
        since: sinceString,
        facilityId,
        tablesToInclude,
        tablesForFullResync,
        isMobile,
      } = body;
      const since = parseInt(sinceString, 10);
      if (isNaN(since)) {
        throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
      }
      await syncManager.initiatePull(params.sessionId, {
        since,
        facilityId,
        tablesToInclude,
        tablesForFullResync,
        isMobile,
      });
      res.json({});
    }),
  );

  // check if pull snapshot is ready, so client can poll while server asynchronously snapshots
  // changes to pull (which can also be blocked by another sync session finishing its persist phase)
  syncRoutes.get(
    '/:sessionId/pull/ready',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const ready = await syncManager.checkPullReady(sessionId);
      res.json(ready);
    }),
  );

  // count the outgoing changes for a session, and grab the sync tick the pull snapshots up until
  syncRoutes.get(
    '/:sessionId/pull/metadata',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { totalToPull, pullUntil } = await syncManager.fetchPullMetadata(params.sessionId);
      res.json({ totalToPull, pullUntil });
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
      const { params, body } = req;
      const { sessionId } = params;
      const { changes } = body;
      await syncManager.addIncomingChanges(sessionId, changes);
      log.info(`POST to ${sessionId} : ${changes.length} records`);
      res.json({});
    }),
  );

  // mark push completed, so server will persist changes to db
  syncRoutes.post(
    '/:sessionId/push/complete',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { sessionId } = params;
      const { tablesToInclude } = body;
      await syncManager.completePush(sessionId, tablesToInclude);
      res.json({});
    }),
  );

  // check if push is complete, so client can poll while server asynchronously persists changes
  syncRoutes.get(
    '/:sessionId/push/complete',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const isComplete = await syncManager.checkPushComplete(sessionId);
      res.json(isComplete);
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
