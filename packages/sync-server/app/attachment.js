import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError } from 'shared/errors';

export const attachmentRoutes = express.Router();

attachmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { query, params } = req;
    const { base64 } = query;
    const { id } = params;
    const attachment = await req.store.models.Attachment.findByPk(id);

    if (!attachment) {
      throw new ForbiddenError('You do not have permission to view this attachment.');
    }

    if (base64 === 'true') {
      res.send({ data: Buffer.from(attachment.data).toString('base64') });
    } else {
      res.setHeader('Content-Type', attachment.type);
      res.setHeader('Content-Length', attachment.size);
      res.send(Buffer.from(attachment.data));
    }
  }),
);

attachmentRoutes.post(
  '/$',
  asyncHandler(async (req, res) => {
    const Attachment = req.store.models.Attachment;
    const { type, size, data } = Attachment.sanitizeForSyncServer(req.body);
    const attachment = await Attachment.create({
      type,
      size,
      data,
    });

    // Send only the ID to be able to link it to metadata
    res.send({
      attachmentId: attachment.id,
    });
  }),
);
