import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { serveBlob } from '@tamanu/shared/utils/serveBlob';

import { BlobTransferChannel } from '../../blobTransfer';
import { getServerFacilityIds } from '../../serverConfig';
import { CentralServerConnection } from '../../sync';

const SAFE_ID_REGEX = /^[A-Za-z0-9-]+$/;
const ID_SCHEMA = yup
  .string()
  .matches(SAFE_ID_REGEX, 'id must not have spaces or punctuation other than -');

export const attachment = express.Router();

const readAll = async stream => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// Content this server does not hold is resolved from central on demand. The API
// process runs no sync runtime and so has no channel of its own; it builds one
// from the same kind of connection this route already opens to read a legacy
// attachment through.
const transferChannelFor = ({ blobCache, blobStore, deviceId }) => {
  if (!blobCache.transferChannel) {
    blobCache.setTransferChannel(
      new BlobTransferChannel({
        blobStore,
        centralServer: new CentralServerConnection({ deviceId }),
        facilityIds: getServerFacilityIds() ?? [],
      }),
    );
  }
  return blobCache.transferChannel;
};

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
      const channel = transferChannelFor(req);
      const { availability, size } = await channel.availability(hash);

      // spec: ATCH
      // Content central does not hold either cannot be resolved by fetching, so
      // it presents as an existing file awaiting its content. The response
      // carries which way it is pending — awaiting upload from its origin, or
      // awaiting this server's fetch — so the presentation can distinguish them
      // without another request. Content central holds is fetched below and
      // served, not reported pending.
      if (availability === BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD) {
        res.status(202).send({ attachmentId: id, availability });
        return;
      }

      if (base64) {
        res.send({ data: (await readAll(await blobCache.open(hash))).toString('base64') });
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
      } else {
        res.setHeader('Content-Type', localAttachment.type);
        res.setHeader('Content-Length', localAttachment.size);
        res.send(Buffer.from(localAttachment.data));
      }
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
