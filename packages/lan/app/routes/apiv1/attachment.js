import express from 'express';
import asyncHandler from 'express-async-handler';
import { CentralServerConnection } from '../../sync';

export const attachment = express.Router();

attachment.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Attachment');

    const { query, params, deviceId } = req;
    const { base64 } = query;
    const { id } = params;
    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(`attachment/${id}?base64=${base64}`, {
      method: 'GET',
    });
    res.send(response);
  }),
);
