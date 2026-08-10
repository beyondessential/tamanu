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

import { serveBlob } from '@tamanu/shared/utils/serveBlob';

import { isHashReferencedInScope } from './blobReferences';

const putContentQuerySchema = yup
  .object({
    offset: yup.number().integer().min(0).required(),
    totalSize: yup.number().integer().min(0).required(),
  })
  // offset past totalSize would make the remaining-bytes cap (totalSize - offset)
  // negative, which the store reads as "every byte overruns" and discards the
  // staging — so a miscalculating client could wipe its own resume progress.
  .test('offset-within-total', 'offset must not exceed totalSize', ({ offset, totalSize }) =>
    offset <= totalSize,
  );

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
    // Only verified content is servable. Stated as an allow-list rather than a
    // list of states to exclude, so a state added later is withheld until it is
    // deliberately allowed rather than served by omission.
    if (!held || held.integrityState !== BLOB_INTEGRITY_STATES.VERIFIED) {
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
      // spec: SCRUB
      // servableStat, so a quarantined copy is wanted rather than declined.
      // This is central's peer healing: it cannot reach a facility on demand
      // and keeps no index of what facilities hold, so it takes a replacement
      // on the connection a facility makes anyway, whenever one happens to
      // offer content central has found to be bad.
      if (await servableStat(hash)) {
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

      // spec: SCRUB — matches the offer: a quarantined copy is being replaced,
      // so the bytes are accepted rather than acknowledged against bad content.
      if (await servableStat(hash)) {
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

      // The stat already fetched is passed through so the read path queries the
      // registry once, not twice, on the primary serving route.
      await serveBlob(req, res, {
        hash,
        size: held.size,
        open: range => blobStore.get(hash, { ...range, stat: held }),
      });
    }),
  );

  return routes;
};
