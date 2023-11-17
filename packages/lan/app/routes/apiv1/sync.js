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

    const completeSync = async () => {
      await syncManager.triggerSync({
        urgent: true,
        type: 'userRequested',
        userId: user.id,
        userEmail: user.email,
      });
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
