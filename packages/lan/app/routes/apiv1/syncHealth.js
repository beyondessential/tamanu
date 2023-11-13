import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync/CentralServerConnection';

export const syncHealth = express.Router();

syncHealth.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { deviceId } = req;
    req.flagPermissionChecked();
    const centralServer = new CentralServerConnection({ deviceId }, await req.settings.get('sync'));

    // The desktop client and lan server should still work without
    // a connected sync server, we just want to notify the user they aren't
    // connected to sync.
    try {
      // This request will fail if the sync servers `versionCompatibility`
      // middleware check fails. We don't need the response, only the error message.
      await centralServer.whoami();

      res.send({ healthy: true });
    } catch (error) {
      // The desktop client needs to receive this response to alert the user
      // of an out of date sync server, but we don't want TamanuApi to catch and throw the error.
      res.send({ healthy: false, error: error.message });
    }
  }),
);
