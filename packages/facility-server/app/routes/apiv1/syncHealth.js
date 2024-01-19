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

    // The web app and facility server should still work without a connected
    // central, we just want to notify the user they aren't connected to central.
    try {
      // This request will fail if the central servers `versionCompatibility`
      // middleware check fails. We don't need the response, only the error message.
      await centralServer.whoami();

      res.send({ healthy: true });
    } catch (error) {
      // The web client needs to receive this response to alert the user
      // of an out of date central server, but we don't want TamanuApi to catch and throw the error.
      res.send({ healthy: false, error: error.message });
    }
  }),
);
