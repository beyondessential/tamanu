import express from 'express';
import asyncHandler from 'express-async-handler';

import { Op } from 'sequelize';
import { log } from '@tamanu/shared/services/logging';
import { ForbiddenError } from '@tamanu/shared/errors';
import { completeSyncSession } from '@tamanu/database/sync';

import { CentralSyncManager } from './CentralSyncManager';

export const buildSyncRoutes = ctx => {
  const syncManager = new CentralSyncManager(ctx);
  const syncRoutes = express.Router();

  // create new sync session or join/update the queue for one
  syncRoutes.post(
    '/',
    asyncHandler(async (req, res) => {
      const {
        store,
        user,
        body: { facilityIds, deviceId, isMobile },
        models: { SyncQueuedDevice, SyncSession },
      } = req;

      const userInstance = await store.models.User.findByPk(user.id);
      if (!await userInstance.canSync(facilityIds, req)) {
        throw new ForbiddenError('User cannot sync');
      }
      if (facilityIds.some(id => !userInstance.canAccessFacility(id))) {
        throw new ForbiddenError('User does not have access to facility');
      }

      // first check if our device has any stale sessions...
      const staleSessions = await SyncSession.findAll({
        where: {
          completedAt: { [Op.is]: null },
          parameters: {
            deviceId,
          },
        },
      });

      // ... and close them out if so
      // (highly likely 0 or 1, but still loop as multiples are still theoretically possible)
      for (const session of staleSessions) {
        await completeSyncSession(
          store,
          session.id,
          'Session marked as completed due to its device reconnecting',
        );
        const durationMs = Date.now() - session.startTime;
        log.info('StaleSyncSessionCleaner.closedReconnectedSession', {
          sessionId: session.id,
          durationMs,
          facilityIds: session.parameters.facilityIds,
          deviceId: session.parameters.deviceId,
        });
      }

      // now update our position in the queue and check if we're at the front of it
      const queueRecord = await SyncQueuedDevice.checkSyncRequest({
        lastSyncedTick: 0,
        urgent: false,
        ...req.body,
      });
      log.info('Queue position', queueRecord.get({ plain: true }));

      // if we're not at the front of the queue, we're waiting
      if (queueRecord.id !== req.body.deviceId) {
        res.send({
          status: 'waitingInQueue',
          behind: queueRecord,
        });
        return;
      }

      // we're at the front of the queue, but if the previous device's sync is still
      // underway we need to wait for that
      const isSyncCapacityFull = await syncManager.getIsSyncCapacityFull();
      if (isSyncCapacityFull) {
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

      const { sessionId, tick } = await syncManager.startSession({
        userId: user.id,
        deviceId,
        facilityIds,
        isMobile
      });
      res.json({ sessionId, tick });
    }),
  );

  // fetch if the session is ready to start syncing
  syncRoutes.get(
    '/:sessionId/ready',
          asyncHandler(async (req, res) => {
        console.time('checkReady');
        const { params } = req;
        const { sessionId } = params;
        const routeTiming = syncManager.createRouteTiming(sessionId, 'checkReady');
        
        const ready = await syncManager.checkSessionReady(sessionId, 'checkReady');
        
        res.json(ready);
        if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
        console.timeEnd('checkReady');
      }),
  );

  // fetch sync metadata
  syncRoutes.get(
    '/:sessionId/metadata',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'getMetadata');
      
      const { startedAtTick } = await syncManager.fetchSyncMetadata(sessionId, 'getMetadata');
      
      res.json({ startedAtTick });
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // set the since and facilityId for a pull session
  syncRoutes.post(
    '/:sessionId/pull/initiate',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'initiate');
      
      const {
        since: sinceString,
        facilityIds,
        tablesToInclude,
        tablesForFullResync,
        deviceId,
      } = body;
      
      const since = parseInt(sinceString, 10);
      if (isNaN(since)) {
        throw new Error('Must provide "since" when creating a pull filter, even if it is 0');
      }
      if (routeTiming) routeTiming.log('validateSince');
      
      await syncManager.initiatePull(sessionId, {
        since,
        facilityIds,
        tablesToInclude,
        tablesForFullResync,
        deviceId,
      }, 'initiate');
      
      res.json({});
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // check if pull snapshot is ready, so client can poll while server asynchronously snapshots
  // changes to pull (which can also be blocked by another sync session finishing its persist phase)
  syncRoutes.get(
    '/:sessionId/pull/ready',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'checkPullReady');
      
      const ready = await syncManager.checkPullReady(sessionId, 'checkPullReady');
      
      res.json(ready);
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // count the outgoing changes for a session, and grab the sync tick the pull snapshots up until
  syncRoutes.get(
    '/:sessionId/pull/metadata',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'getPullMetadata');
      
      const { totalToPull, pullUntil } = await syncManager.fetchPullMetadata(sessionId, 'getPullMetadata');
      
      res.json({ totalToPull, pullUntil });
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // pull changes down to facility
  syncRoutes.get(
    '/:sessionId/pull',
    asyncHandler(async (req, res) => {
      const { query, params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'pullChanges');
      
      const { fromId, limit = '100' } = query;
      
      const changes = await syncManager.getOutgoingChanges(sessionId, {
        fromId,
        limit: parseInt(limit, 10),
      }, 'pullChanges');
      
      log.info(`GET /pull : returned ${changes.length} changes`);
      res.json(changes);
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // push changes in from facility
  syncRoutes.post(
    '/:sessionId/push',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'pushChanges');
      
      const { changes } = body;
      
      await syncManager.addIncomingChanges(sessionId, changes, 'pushChanges');
      
      log.info(`POST to ${sessionId} : ${changes.length} records`);
      res.json({});
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // mark push completed, so server will persist changes to db
  syncRoutes.post(
    '/:sessionId/push/complete',
    asyncHandler(async (req, res) => {
      const { params, body } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'completePush');
      
      const { tablesToInclude, deviceId } = body;
      
      await syncManager.completePush(sessionId, deviceId, tablesToInclude, 'completePush');
      
      res.json({});
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // check if push is complete, so client can poll while server asynchronously persists changes
  syncRoutes.get(
    '/:sessionId/push/complete',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'checkPushComplete');
      
      const isComplete = await syncManager.checkPushComplete(sessionId, 'checkPushComplete');
      
      res.json(isComplete);
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
    }),
  );

  // end session
  syncRoutes.delete(
    '/:sessionId',
    asyncHandler(async (req, res) => {
      const { params } = req;
      const { sessionId } = params;
      const routeTiming = syncManager.createRouteTiming(sessionId, 'endSession');
      if (routeTiming) routeTiming.log('parseParams');
      
      await syncManager.endSession(sessionId, 'endSession');
      if (routeTiming) routeTiming.log('endSessionComplete');
      
      // Save route timing before finalizing session benchmark
      if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
      
      // Now finalize and save the complete session benchmark
      await syncManager.finalizeSessionBenchmark(sessionId);
      
      res.json({});
    }),
  );

  return syncRoutes;
};
