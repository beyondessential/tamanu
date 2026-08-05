import { pipeline } from 'node:stream/promises';

import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import {
  BLOB_AVAILABILITY_STATES,
  BLOB_INTEGRITY_STATES,
  BLOB_OFFER_STATUSES,
  DEVICE_SCOPES,
} from '@tamanu/constants';
import { ForbiddenError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { parseBlobHash } from '@tamanu/utils/blobs';

import { isHashReferencedInScope } from './blobReferences';

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
// an open content-addressed endpoint, and every operation is scoped at the
// reference layer: a hash is visible or pushable only through a synchronised
// record within the requester's data scope (see
// specs/blob-storage/access-control.md).
export const buildBlobTransferRoutes = ctx => {
  const { blobStore } = ctx;
  const routes = express.Router();

  routes.use(ensurePermissionCheck);
  routes.use((req, _res, next) => {
    // Flag first so a rejection below sends through the normal error path
    // rather than the "no permission check ran" trap (which would 501). The
    // device-scope assertion is this route's permission check.
    req.flagPermissionChecked();
    if (!req.device) {
      throw new ForbiddenError(
        'Blob transfer requires an authenticated device ID (ie provided at login)',
      );
    }
    req.device.ensureHasScope(DEVICE_SCOPES.SYNC_CLIENT);
    next();
  });

  // spec: BLAC
  // The requesting server's scope is the set of facilities it declares it is
  // operating as — exactly what record synchronisation scopes a pull to, and
  // typically the one facility the server runs. Declared by the client and
  // validated against the user's entitlement, the same check the sync session
  // makes; the entitlement itself is only the ceiling, never the scope, since
  // a facility server's sync user is often entitled to every facility.
  const requestFacilityScope = async req => {
    const raw = req.query.facilityIds;
    const facilityIds = (Array.isArray(raw) ? raw : [raw]).filter(id => typeof id === 'string');
    if (facilityIds.length === 0) {
      throw new ForbiddenError('Blob transfer requires the requesting facilities');
    }
    const user = await req.store.models.User.findByPk(req.user.id);
    for (const facilityId of facilityIds) {
      if (!(await user.canAccessFacility(facilityId))) {
        throw new ForbiddenError('User does not have access to facility');
      }
    }
    return facilityIds;
  };

  // spec: BLAC
  // A hash is in scope when a record referencing it lies within the declared
  // facility scope. Out-of-scope and unreferenced hashes are treated
  // identically to ones the store does not hold, so the channel discloses
  // nothing about unscoped content.
  const hashInScope = async (req, hash) =>
    await isHashReferencedInScope(req.store.sequelize, {
      hash,
      facilityIds: await requestFacilityScope(req),
    });

  // spec: BLAC, SCRUB
  // The store retains a quarantined blob but never serves it. On the read path
  // it is therefore not held: availability and fetch answer as they would for
  // absent content, so neither advertises a blob fetch would refuse nor
  // discloses the quarantine.
  const servableStat = async hash => {
    const held = await blobStore.stat(hash);
    if (!held || held.integrityState === BLOB_INTEGRITY_STATES.QUARANTINED) {
      return null;
    }
    return held;
  };

  // Identical for a hash that is genuinely not held and one outside the
  // requester's scope: the two must be indistinguishable.
  const blobNotHeld = hash =>
    new NotFoundError(`Blob not held: ${hash}`).withExtraData({
      availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
    });

  // Identical whether or not the content is held: an unexpected push must not
  // disclose what the central store holds.
  const pushNotExpected = hash => new ForbiddenError(`Blob not expected: ${hash}`);

  // spec: XFER
  // Availability without transferring bytes. The central server is the
  // authoritative store and never fetches, so absent bytes are always awaiting
  // upload from their origin. Quarantine serving policy is the integrity
  // spec's concern (see specs/blob-storage/integrity.md).
  routes.get(
    '/:hash/availability',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      // spec: BLAC
      // Scoping applies to the probe as much as the fetch: whether unscoped
      // content exists is itself information.
      const held = (await hashInScope(req, hash)) && (await servableStat(hash));
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
      // spec: BLAC
      // Sync-first push: the offer is accepted only once a synchronised record
      // within the offering server's scope references the hash. Checked before
      // the store is consulted so an unexpected offer for held content is
      // refused identically to one for absent content.
      if (!(await hashInScope(req, hash))) {
        throw pushNotExpected(hash);
      }
      // Plain stat, not servableStat: a quarantined copy still occupies the
      // hash, so re-pushing it would no-op against the retained bytes. Pushing
      // a good replacement over a quarantined copy is the self-heal path, which
      // belongs to the integrity spec (see specs/blob-storage/integrity.md).
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

      // spec: BLAC
      // Refusal applies from the first byte and to every resumed segment:
      // content for an unexpected hash is never staged, even partially, so
      // transient storage is as bounded as admitted storage.
      if (!(await hashInScope(req, hash))) {
        throw pushNotExpected(hash);
      }

      if (await blobStore.stat(hash)) {
        res.send({ acknowledged: true, existed: true });
        return;
      }

      // maxBytes caps the write at the declared remaining total, so an origin
      // sending more than it declared is refused before the excess reaches
      // disk rather than after the whole body has been staged.
      const { stagedSize } = await blobStore.stage(hash, req, {
        offset,
        maxBytes: totalSize - offset,
      });
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
      // spec: BLAC
      // A hash outside the requester's scope answers exactly as one the store
      // does not hold, from the same throw site so the responses cannot drift
      // apart.
      const held = (await hashInScope(req, hash)) && (await servableStat(hash));
      if (!held) {
        throw blobNotHeld(hash);
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

      // Pass the stat already fetched so the read path queries the registry
      // once, not twice, on the primary serving route.
      const stream = await blobStore.get(hash, range ? { start, end, stat: held } : { stat: held });
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
