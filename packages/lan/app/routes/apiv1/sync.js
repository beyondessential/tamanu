import express from 'express';
import asyncHandler from 'express-async-handler';

import { CURRENT_SYNC_TIME_KEY } from 'shared/sync/constants';

export const sync = express.Router();

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { syncManager, user } = req;

    req.flagPermissionChecked(); // no particular permission check for triggering a sync

    if (syncManager.isSyncRunning()) {
      res.send({ message: 'Sync already underway' });
      return;
    }

    const completeSync = async () => {
      await syncManager.triggerSync(`requested by ${user.email}`);
      return 'Completed sync';
    };

    const timeoutAfter = seconds =>
      new Promise(resolve => {
        setTimeout(
          () => resolve('Sync is taking a while, continuing in the background...'),
          seconds * 1000,
        );
      });

    const message = await Promise.race([completeSync(), timeoutAfter(10)]);

    res.send({ message });
  }),
);

sync.get(
  '/status',
  asyncHandler(async (req, res) => {
    const { syncManager, models } = req;

    req.flagPermissionChecked(); // no particular permission check for checking sync status

    const lastCompletedSyncTick = parseInt(await models.LocalSystemFact.get(CURRENT_SYNC_TIME_KEY));
    const lastCompletedDurationMs = syncManager.lastDurationMs;
    const { lastCompletedAt } = syncManager;

    const isSyncRunning = syncManager.isSyncRunning();
    const currentDuration = isSyncRunning ? new Date().getTime() - syncManager.currentStartTime : 0;

    res.send({
      lastCompletedSyncTick,
      lastCompletedAt,
      lastCompletedDurationMs,
      currentDuration,
      isSyncRunning,
    });
  }),
);
