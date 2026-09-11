import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const systemErrorReport = express.Router();

systemErrorReport.post(
  '/',
  asyncHandler(async (req, res) => {
    // Any logged-in user can report a system error; there's no specific ability to check.
    req.flagPermissionChecked();

    const { deviceId, user, facilityId, body } = req;

    const centralServer = new CentralServerConnection({ deviceId });
    // .fetch() (not .post()) so backoff:false also reaches the login attempt via
    // preserveBackoffForAuthAttempt — otherwise an unreachable central blocks on a long login retry.
    const response = await centralServer.fetch('systemErrorReport', {
      method: 'POST',
      body: { ...body, userId: user.id, facilityId },
      retryAuth: true,
      backoff: false,
      preserveBackoffForAuthAttempt: true,
    });

    res.send(response);
  }),
);
