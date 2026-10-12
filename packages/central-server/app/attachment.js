import { Readable } from 'node:stream';

import express from 'express';
import asyncHandler from 'express-async-handler';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';

import { readBlobAsBase64, serveBlob } from '@tamanu/shared/utils/serveBlob';

import { blobServeGate } from './blobServing';

export const attachmentRoutes = express.Router();

//TODO: Remove when permission check are implemented in all central server routes
attachmentRoutes.use(ensurePermissionCheck);

// spec: ATCH
// The base64 mode is for clients that consume content inline (profile pictures, photo answers).
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
      // spec: SCRUB
      const stat = await blobStore.servableStat(attachment.hash);
      // spec: ATCH
      // Central never fetches, so absent bytes are always awaiting upload from the origin.
      if (!stat) {
        res.status(202).send({
          attachmentId: id,
          availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
        });
        return;
      }
      // spec: AV
      // Infected content says so rather than presenting as pending: it's never coming.
      const withheld = await blobServeGate(
        { settings: req.settings, models: req.store.models },
        attachment.hash,
        stat,
      );
      if (withheld) {
        res.status(202).send({ attachmentId: id, availability: withheld });
        return;
      }
      if (base64 === 'true') {
        const data = await readBlobAsBase64({
          size: stat.size,
          open: () => blobStore.get(attachment.hash, { stat }),
        });
        res.send({ data });
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
      return;
    }

    // spec: BKFL
    // The length comes from the bytes, not the column: the range arithmetic depends on it.
    const bytes = Buffer.from(attachment.data);
    await serveBlob(req, res, {
      size: bytes.length,
      contentType: attachment.type,
      open: ({ start, end }) =>
        Readable.from([start === undefined ? bytes : bytes.subarray(start, end + 1)]),
    });
  }),
);

// spec: ATCH
// The recorded size is the admitted bytes', not the caller's declaration.
attachmentRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Attachment');

    // Scope is never taken from the body, or a client could scope an attachment to any patient. One
    // created here stays central-only until a server-side writer references it.
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
