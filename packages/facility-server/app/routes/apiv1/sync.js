import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  LAST_SUCCESSFUL_SYNC_PULL_KEY,
  LAST_SUCCESSFUL_SYNC_PUSH_KEY,
} from '@tamanu/shared/sync/constants';

export const sync = express.Router();

function resultToMessage({ enabled, queued, ran, timedOut }) {
  if (timedOut) return 'Sync is taking a while, continuing in the background...';
  if (!enabled) return "Sync was disabled and didn't run";
  if (ran) return 'Sync completed';
  if (queued) return 'Sync queued and will run later';
  throw new Error('Unknown sync status');
}

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { syncManager, user } = req;

    req.flagPermissionChecked(); // no particular permission check for triggering a sync

    const completeSync = () =>
      syncManager.triggerSync({
        urgent: true,
        type: 'userRequested',
        userId: user.id,
        userEmail: user.email,
      });

    const timeoutAfter = seconds =>
      new Promise(resolve => {
        setTimeout(() => resolve({ timedOut: true }), seconds * 1000);
      });

    const result = await Promise.race([completeSync(), timeoutAfter(10)]);
    const message = resultToMessage(result);

    res.send({ message });
  }),
);

sync.get(
  '/status',
  asyncHandler(async (req, res) => {
    const { syncManager, models } = req;

    req.flagPermissionChecked(); // no particular permission check for checking sync status

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
