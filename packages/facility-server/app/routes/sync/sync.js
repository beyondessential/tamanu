import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  LAST_SUCCESSFUL_SYNC_PULL_KEY,
  LAST_SUCCESSFUL_SYNC_PUSH_KEY,
} from '@tamanu/shared/sync/constants';

export const sync = express.Router();

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { syncManager } = req;
    const { syncData } = req.body;

    const result = await syncManager.triggerSync(syncData);

    res.send(result);
  }),
);

sync.get(
  '/status',
  asyncHandler(async (req, res) => {
    const { syncManager, models } = req;

    const [lastCompletedPull, lastCompletedPush] = (
      await Promise.all(
        [LAST_SUCCESSFUL_SYNC_PULL_KEY, LAST_SUCCESSFUL_SYNC_PUSH_KEY].map(key =>
          models.LocalSystemFact.get(key),
        ),
      )
    ).map(num => parseInt(num));
    const lastCompletedDurationMs = syncManager.lastDurationMs;
    const { lastCompletedAt } = syncManager;

    const isSyncRunning = syncManager.isSyncRunning();
    const currentDuration = isSyncRunning ? new Date().getTime() - syncManager.currentStartTime : 0;

    res.send({
      lastCompletedPull,
      lastCompletedPush,
      lastCompletedAt,
      lastCompletedDurationMs,
      currentDuration,
      isSyncRunning,
    });
  }),
);
