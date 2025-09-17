import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, InsufficientStorageError } from '@tamanu/shared/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { canUploadAttachment } from './utils/getFreeDiskSpace';

export const attachmentRoutes = express.Router();

//TODO: Remove when permission check are implemented in all central server routes
attachmentRoutes.use(ensurePermissionCheck);

attachmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Attachment');

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
    const { settings } = req;
    req.checkPermission('create', 'Attachment');

    const canUpload = await canUploadAttachment(settings);

    if (!canUpload) {
      throw new InsufficientStorageError(
        'Document cannot be uploaded due to lack of storage space.',
      );
    }

    const { Attachment } = req.store.models;
    const { type, size, data } = Attachment.sanitizeForDatabase(req.body);
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
