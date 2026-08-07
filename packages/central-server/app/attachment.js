import { Readable } from 'node:stream';

import express from 'express';
import asyncHandler from 'express-async-handler';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';

import { serveBlob } from '@tamanu/shared/utils/serveBlob';

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
      // spec: ATCH
      // Central holds the record but its origin may not have pushed the bytes
      // yet: present it as an existing file awaiting its content rather than
      // reading a null stat. Central is authoritative and never fetches, so
      // absent bytes are always awaiting upload from the origin.
      if (!stat) {
        res.status(202).send({
          attachmentId: id,
          availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
        });
        return;
      }
      if (base64 === 'true') {
        const stream = await blobStore.get(attachment.hash, { stat });
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        res.send({ data: Buffer.concat(chunks).toString('base64') });
        return;
      }
      await serveBlob(req, res, {
        hash: attachment.hash,
        size: stat.size,
        contentType: attachment.type,
        open: range => blobStore.get(attachment.hash, { ...range, stat }),
      });
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

    // Scope is never taken from the request body: this route has no caller that
    // is entitled to set another patient's or encounter's scope, and trusting the
    // body would let a client scope an attachment to any patient. Attachments are
    // scoped by the server-side writer that owns the referencing record (a
    // document, letter, survey answer, or lab report); one created here carries no
    // scope and stays central-only until such a writer references it.
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
