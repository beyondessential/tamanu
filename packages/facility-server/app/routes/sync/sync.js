import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_LAST_SUCCESSFUL_SYNC_PUSH,
} from '@tamanu/constants/facts';

export const sync = express.Router();

/**
 * The sync triggering api is non-authed, and generally protected by making it
 * only accessible on localhost via the reverse proxy. This is ok because it doesn't
 * do anything sensitive or dangerous, but please keep it that way - only add new routes
 * or functionality with healthy caution, or after implementing auth.
 * This TRUSTED_ENDPOINTS check is to make sure you've read and considered this!
 */
const TRUSTED_ENDPOINTS = ['run', 'status'];
sync.use((req, _res, next) => {
  if (!TRUSTED_ENDPOINTS.includes(req.path.split('/')[1])) {
    throw new Error('Attempted to access untrusted endpoint');
  }
  next();
});

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
        [FACT_LAST_SUCCESSFUL_SYNC_PULL, FACT_LAST_SUCCESSFUL_SYNC_PUSH].map(key =>
          models.LocalSystemFact.get(key),
        ),
      )
    ).map(num => parseInt(num));
    const lastCompletedDurationMs = syncManager.lastDurationMs;
    const { lastCompletedAt } = syncManager;
    const lastCompletedAgo = lastCompletedAt ? new Date() - new Date(lastCompletedAt) : 0;

    const isSyncRunning = syncManager.isSyncRunning();
    const currentDuration = isSyncRunning ? new Date().getTime() - syncManager.currentStartTime : 0;

    res.send({
      lastCompletedPull,
      lastCompletedPush,
      lastCompletedAt,
      lastCompletedAgo,
      lastCompletedDurationMs,
      currentDuration,
      isSyncRunning,
    });
  }),
);
