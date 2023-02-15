import express from 'express';
import asyncHandler from 'express-async-handler';

export const sync = express.Router();

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { syncManager } = req;

    req.flagPermissionChecked(); // no particular permission check for triggering a sync

    await syncManager.triggerSync();

    res.send({ message: 'Sync completed' });
  }),
);
