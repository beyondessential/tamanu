import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const systemErrorReport = express.Router();

systemErrorReport.post(
  '/',
  asyncHandler(async (req, res) => {
    // Any logged-in user can report a system error; there's no specific ability to check.
    req.flagPermissionChecked();

    const { deviceId, user, facilityId, settings, body } = req;
    const { recipients } = await settings[facilityId].get('systemErrorReport');

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.post('systemErrorReport', {
      ...body,
      userId: user.id,
      recipients,
    });

    res.send(response);
  }),
);
