import { Readable } from 'node:stream';

import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { readBlobAsBase64, serveBlob } from '@tamanu/shared/utils/serveBlob';

import { resolveBlobForRead } from '../../blobServing';
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

    const { query, params, deviceId, blobCache } = req;
    const base64 = await yup.boolean().default(false).validate(query?.base64);
    const id = await ID_SCHEMA.required().validate(params.id);

    const localAttachment = await req.models.Attachment.findByPk(id);

    // spec: ATCH
    // A hash-backed attachment is served from the local store, resolving the
    // bytes from central on a miss and caching them. Serving goes through the
    // cache's open so the read defers eviction for its whole window and counts
    // as a use.
    if (localAttachment?.hash) {
      const { hash, type } = localAttachment;

      const { availability, size } = await resolveBlobForRead(req, hash);
      if (availability) {
        res.status(202).send({ attachmentId: id, availability });
        return;
      }

      if (base64) {
        res.send({ data: await readBlobAsBase64({ size, open: () => blobCache.open(hash) }) });
        return;
      }

      await serveBlob(req, res, {
        hash,
        size,
        contentType: type,
        open: range => blobCache.open(hash, range),
      });
      return;
    }

    if (localAttachment) {
      if (base64) {
        res.send({ data: Buffer.from(localAttachment.data).toString('base64') });
        return;
      }

      // spec: BKFL — served the same way a moved row is, so a reader cannot tell
      // which form it got. The length comes from the bytes rather than the
      // column, since the range arithmetic depends on it.
      const bytes = Buffer.from(localAttachment.data);
      await serveBlob(req, res, {
        size: bytes.length,
        contentType: localAttachment.type,
        open: ({ start, end }) =>
          Readable.from([start === undefined ? bytes : bytes.subarray(start, end + 1)]),
      });
      return;
    }

    // spec: ATCH
    // Legacy attachments reside only on the central server, so an attachment
    // with no local record is served by reading it through central.
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
