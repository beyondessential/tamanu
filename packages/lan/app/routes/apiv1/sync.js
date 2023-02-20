import express from 'express';
import asyncHandler from 'express-async-handler';

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
    
    syncManager.triggerSync(`requested by ${user.email}`);
    res.send({ message: 'Sync started' });
  }),
);
