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
    // CentralServerConnection defaults to a long Fibonacci backoff (up to ~76s across 15
    // attempts) suited to sync, but this is a synchronous user action from a modal — try
    // once and fail fast rather than leaving the user staring at a spinner.
    const response = await centralServer.post(
      'systemErrorReport',
      { ...body, userId: user.id, recipients },
      { backoff: false },
    );

    res.send(response);
  }),
);
