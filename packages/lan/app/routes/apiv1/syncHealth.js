import express from 'express';
import asyncHandler from 'express-async-handler';
import { WebRemote } from '../../sync/WebRemote';

export const syncHealth = express.Router();

syncHealth.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const remote = new WebRemote();

    // The desktop client and lan server should still work without
    // a connected sync server, we just want to notify the user they aren't
    // connected to sync.
    try {
      // This request will fail if the sync servers `versionCompatibility`
      // middleware check fails. We don't need the response, only the error message.
      await remote.whoami();

      res.send({ healthy: true });
    } catch (error) {
      // The desktop client needs to receive this response to alert the user
      // of an out of date sync server, but we don't want TamanuApi to catch and throw the error.
      res.send({ healthy: false, error: error.message });
    }
  }),
);
