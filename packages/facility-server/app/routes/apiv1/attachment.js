import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';
import { CentralServerConnection } from '../../sync';

const SAFE_ID_REGEX = /^[A-Za-z0-9-]+$/;
const ID_SCHEMA = yup
  .string()
  .matches(SAFE_ID_REGEX, 'id must not have spaces or punctuation other than -');

export const attachment = express.Router();

attachment.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Attachment');

    const { query, params, deviceId } = req;
    const base64 = await yup.boolean().default(false).validate(query?.base64);
    const id = await ID_SCHEMA.required().validate(params.id);

    const localAttachment = await req.models.Attachment.findByPk(id);

    if (localAttachment) {
      if (base64) {
        res.send({ data: Buffer.from(localAttachment.data).toString('base64') });
      } else {
        res.setHeader('Content-Type', localAttachment.type);
        res.setHeader('Content-Length', localAttachment.size);
        res.send(Buffer.from(localAttachment.data));
      }
      return;
    }

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(
      `attachment/${encodeURIComponent(id)}?base64=${base64}`,
      {
        method: 'GET',
        backoff: { maxAttempts: 5, maxWaitMs: 1000 },
      },
    );
    res.send(response);
  }),
);
