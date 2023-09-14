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
    const localAttachment = await req.models.Attachment.findByPk(params.id);

    if (localAttachment) {
      if (base64 === 'true') {
        res.send({ data: Buffer.from(localAttachment.data).toString('base64') });
      } else {
        res.setHeader('Content-Type', localAttachment.type);
        res.setHeader('Content-Length', localAttachment.size);
        res.send(Buffer.from(localAttachment.data));
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
