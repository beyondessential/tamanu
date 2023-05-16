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
    const attachment = await req.models.Attachment.findByPk(params.id);

    if (attachment) {
      if (base64 === 'true') {
        res.send({ data: Buffer.from(attachment.data).toString('base64'), type: attachment.type });
      } else {
        res.setHeader('Content-Type', attachment.type);
        res.setHeader('Content-Length', attachment.size);
        res.send(Buffer.from(attachment.data));
      }
      return;
    }

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(`attachment/${id}?base64=${base64}`, {
      method: 'GET',
    });
    res.send(response);
  }),
);
