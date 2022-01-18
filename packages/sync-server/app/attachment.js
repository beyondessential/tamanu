import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { ForbiddenError, InvalidOperationError } from 'shared/errors';
import { getFreeDiskSpace } from './utils/getFreeDiskSpace';

export const attachmentRoutes = express.Router();

// Convert value in config to bytes (prefer decimal over binary conversion)
const FREE_SPACE_REQUIRED =
  parseInt(config.disk.freeSpaceRequired.gigabytesForUploadingDocuments, 10) * 1000000000;

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
    const freeDiskSpace = await getFreeDiskSpace();

    if (!freeDiskSpace || freeDiskSpace < FREE_SPACE_REQUIRED) {
      throw new InvalidOperationError('Document cannot be uploaded due to lack of storage space.');
    }

    const { Attachment } = req.store.models;
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
