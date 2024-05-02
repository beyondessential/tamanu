import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const centralPublicRoutes = express.Router();

centralPublicRoutes.get(
  '/*',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    // get query params
    const { query, originalUrl } = req;
    const centralServer = new CentralServerConnection({ deviceId: req.deviceId });
    const centralPath = originalUrl.replace('/api', '').replace('central/', ''); // will retain /public at the start where necessary
    const response = await centralServer.fetch(centralPath, query);
    res.send(response);
  }),
);
