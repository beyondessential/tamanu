import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError } from 'shared/errors';

export const attachmentRoutes = express.Router();

attachmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { id } = params;
    const attachment = await req.store.models.Attachment.findByPk(id);

    if (!attachment) {
      throw new ForbiddenError('You do not have permission to view this attachment.');
    }

    res.status(200);
    res.setHeader('Content-Type', attachment.type);
    res.setHeader('Content-Length', attachment.size);
    res.send(Buffer.from(attachment.data));
  }),
);
