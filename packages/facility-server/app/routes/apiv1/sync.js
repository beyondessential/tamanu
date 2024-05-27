import express from 'express';
import asyncHandler from 'express-async-handler';

export const sync = express.Router();

sync.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { syncConnection, user } = req;

    req.flagPermissionChecked(); // no particular permission check for checking sync status

    const syncResult = await syncConnection.runSync({
      urgent: true,
      type: 'userRequested',
      userId: user.id,
      userEmail: user.email,
    });

    res.send(syncResult);
  }),
);

sync.get(
  '/status',
  asyncHandler(async (req, res) => {
    const { syncConnection } = req;

    req.flagPermissionChecked(); // no particular permission check for checking sync status

    const status = await syncConnection.getSyncStatus();

    res.send(status);
  }),
);
