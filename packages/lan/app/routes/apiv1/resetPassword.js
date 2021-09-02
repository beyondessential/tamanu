import express from 'express';
import asyncHandler from 'express-async-handler';
import { WebRemote } from '~/sync';

export const resetPassword = express.Router();

resetPassword.post(
  '/$',
  asyncHandler(async (req, res) => {
    // no permission needed
    req.flagPermissionChecked();

    const remote = new WebRemote();
    const response = await remote.forwardRequest(req, 'resetPassword');

    res.send(response);
  }),
);
