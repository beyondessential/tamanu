import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const resetPassword = express.Router();

resetPassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { deviceId } = req;
    // no permission needed
    req.flagPermissionChecked();

    const centralServer = new CentralServerConnection({ deviceId }, await req.settings.get('sync'));
    const response = await centralServer.forwardRequest(req, 'resetPassword');

    res.send(response);
  }),
);
