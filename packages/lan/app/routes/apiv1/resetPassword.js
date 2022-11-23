import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const resetPassword = express.Router();

resetPassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    // no permission needed
    req.flagPermissionChecked();

    const centralServer = new CentralServerConnection();
    const response = await centralServer.forwardRequest(req, 'resetPassword');

    res.send(response);
  }),
);
