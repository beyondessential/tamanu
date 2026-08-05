import { pipeline } from 'node:stream/promises';

import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { BLOB_AVAILABILITY_STATES, BLOB_OFFER_STATUSES, DEVICE_SCOPES } from '@tamanu/constants';
import { ForbiddenError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { parseBlobHash } from '@tamanu/utils/blobs';

// Resume-oriented subset of HTTP ranges: a single open-ended or closed range.
// Anything else is ignored and the full blob served, as RFC 9110 permits.
const RANGE_PATTERN = /^bytes=(?<start>\d+)-(?<end>\d*)$/;

const putContentQuerySchema = yup.object({
  offset: yup.number().integer().min(0).required(),
  totalSize: yup.number().integer().min(0).required(),
});

const validateHash = hash => {
  try {
    parseBlobHash(hash);
  } catch (error) {
    throw new InvalidParameterError(error.message);
  }
  return hash;
};

// spec: XFER, BLAC
// The server-to-server blob transfer channel: probe a hash's availability,
// fetch its bytes (streamed, ranged for resume), and offer/push bytes in
// offset-addressed chunks staged until verified. Gated on the same
// authenticated sync-client device scope as record sync, so the store is never
// an open content-addressed endpoint; reference-level data scoping layers on
// top (see specs/blob-storage/access-control.md).
export const buildBlobTransferRoutes = ctx => {
  const { blobStore } = ctx;
  const routes = express.Router();

  routes.use(ensurePermissionCheck);
  routes.use((req, _res, next) => {
    if (!req.device) {
      throw new ForbiddenError(
        'Blob transfer requires an authenticated device ID (ie provided at login)',
      );
    }
    req.device.ensureHasScope(DEVICE_SCOPES.SYNC_CLIENT);
    req.flagPermissionChecked();
    next();
  });

  // spec: XFER
  // Availability without transferring bytes. The central server is the
  // authoritative store and never fetches, so absent bytes are always awaiting
  // upload from their origin. Quarantine serving policy is the integrity
  // spec's concern (see specs/blob-storage/integrity.md).
  routes.get(
    '/:hash/availability',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      const held = await blobStore.stat(hash);
      if (held) {
        res.send({ availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: held.size });
      } else {
        res.send({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
      }
    }),
  );

  // spec: XFER
  // Offer: idempotent entry to a push. Content already held skips the byte
  // transfer; otherwise the origin learns how many bytes are already staged
  // and resumes from there.
  routes.post(
    '/:hash/offer',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      if (await blobStore.stat(hash)) {
        res.send({ status: BLOB_OFFER_STATUSES.ALREADY_STORED });
        return;
      }
      res.send({
        status: BLOB_OFFER_STATUSES.WANTED,
        receivedBytes: await blobStore.stagedSize(hash),
      });
    }),
  );

  // spec: XFER
  // Push: append an offset-addressed chunk of the blob's bytes to its staging.
  // Once the declared total has arrived, the content is verified against the
  // hash and admitted; the acknowledgement is returned only after that, so it
  // is a safe signal for the origin to release its durable copy.
  routes.put(
    '/:hash/content',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      const { offset, totalSize } = await putContentQuerySchema.validate(req.query);

      if (await blobStore.stat(hash)) {
        res.send({ acknowledged: true, existed: true });
        return;
      }

      const { stagedSize } = await blobStore.stage(hash, req, { offset });
      if (stagedSize > totalSize) {
        await blobStore.discardStaged(hash);
        throw new InvalidParameterError(
          `Staged content for ${hash} reached ${stagedSize} bytes, over the declared total of ${totalSize}; staging discarded`,
        );
      }
      if (stagedSize < totalSize) {
        res.send({ acknowledged: false, receivedBytes: stagedSize });
        return;
      }

      const { size, existed } = await blobStore.commitStaged(hash);
      res.send({ acknowledged: true, existed, size });
    }),
  );

  // spec: XFER, SERVE
  // Fetch: stream the blob's bytes. Ranged so an interrupted fetch resumes
  // from the bytes already delivered; the hash is the entity tag since it
  // names immutable content. Absent bytes respond with the availability state
  // evident, not a bare miss.
  routes.get(
    '/:hash',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      const held = await blobStore.stat(hash);
      if (!held) {
        throw new NotFoundError(`Blob not held: ${hash}`).withExtraData({
          availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
        });
      }

      const range = req.headers.range?.match(RANGE_PATTERN)?.groups;
      let start;
      let end;
      if (range) {
        start = parseInt(range.start, 10);
        end = range.end === '' ? held.size - 1 : parseInt(range.end, 10);
        if (start >= held.size || end >= held.size || start > end) {
          res.status(416).setHeader('content-range', `bytes */${held.size}`);
          res.end();
          return;
        }
      }

      const stream = await blobStore.get(hash, range ? { start, end } : {});
      res.status(range ? 206 : 200);
      res.setHeader('content-type', 'application/octet-stream');
      res.setHeader('content-length', range ? end - start + 1 : held.size);
      res.setHeader('etag', `"${hash}"`);
      res.setHeader('accept-ranges', 'bytes');
      if (range) {
        res.setHeader('content-range', `bytes ${start}-${end}/${held.size}`);
      }
      // pipeline destroys the file stream when either side terminates, so a
      // client dropping mid-download does not leak the open file handle.
      try {
        await pipeline(stream, res);
      } catch (error) {
        // A client going away mid-download is routine on this channel: it is
        // how an interrupted fetch pauses before resuming with a range request.
        if (error?.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
          throw error;
        }
      }
    }),
  );

  return routes;
};
