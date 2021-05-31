import express from 'express';
import asyncHandler from 'express-async-handler';
import { WebRemote } from '../../sync/WebRemote';

export const syncHealth = express.Router();

syncHealth.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    // This request will fail if the sync servers `versionCompatibility`
    // middleware check fails.
    const remote = new WebRemote();
    const response = await remote.fetch('', {
      method: 'GET',
    });

    // The desktop client needs to receive this response to alert the user
    // of an out of date sync server.
    res.send(response);
  }),
);
