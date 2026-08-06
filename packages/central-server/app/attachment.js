import { Readable } from 'node:stream';

import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';

import { serveBlob } from './utils/serveBlob';

export const attachmentRoutes = express.Router();

//TODO: Remove when permission check are implemented in all central server routes
attachmentRoutes.use(ensurePermissionCheck);

// spec: ATCH
// Attachment content resolves by hash from the blob store; a legacy row instead
// holds its bytes in the database column, so a reader resolves the hash when one
// is present and the in-database bytes otherwise. The base64 mode is retained for
// clients that consume the content inline (profile pictures, photo answers).
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

    if (attachment.hash) {
      const { blobStore } = req.ctx;
      const stat = await blobStore.stat(attachment.hash);
      if (base64 === 'true') {
        const stream = await blobStore.get(attachment.hash, { stat });
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        res.send({ data: Buffer.concat(chunks).toString('base64') });
        return;
      }
      await serveBlob(req, res, blobStore, attachment.hash, stat, { contentType: attachment.type });
      return;
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

// spec: ATCH
// A new attachment's bytes are admitted to the blob store, and its recorded size
// is taken from the bytes actually admitted rather than the caller's declaration.
// The store refuses admission with an insufficient-storage error rather than
// cross the host's free-disk reserve (see capacity.md).
attachmentRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Attachment');

    const { Attachment } = req.store.models;
    const { type, data } = Attachment.sanitizeForDatabase(req.body);
    const { hash, size } = await req.ctx.blobStore.put(Readable.from([data]));
    const attachment = await Attachment.create({ type, hash, size });

    // Send only the ID to be able to link it to metadata
    res.send({
      attachmentId: attachment.id,
    });
  }),
);
