import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import {
  BLOB_AVAILABILITY_STATES,
  BLOB_OFFER_STATUSES,
  DEVICE_SCOPES,
} from '@tamanu/constants';
import { ForbiddenError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { parseBlobHash } from '@tamanu/utils/blobs';

import { serveBlob } from '@tamanu/shared/utils/serveBlob';

import { isHashReferencedInScope } from './blobReferences';
import { blobServeGate } from './blobServing';

const putContentQuerySchema = yup
  .object({
    offset: yup.number().integer().min(0).required(),
    totalSize: yup.number().integer().min(0).required(),
  })
  // An offset past totalSize makes the remaining-bytes cap negative, which the store reads as an
  // overrun and discards the staging.
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
export const buildBlobTransferRoutes = ctx => {
  const { blobStore } = ctx;
  const routes = express.Router();

  routes.use(ensurePermissionCheck);
  routes.use((req, _res, next) => {
    // Flag first so a rejection below goes through the normal error path rather than the 501 trap.
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
  // The scope is the facilities the client declares, validated against the user's entitlement. The
  // entitlement is only a ceiling: a facility's sync user is often entitled to every facility.
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
  // Out-of-scope and unreferenced hashes answer exactly like unheld ones.
  const hashInScope = async (req, hash) =>
    await isHashReferencedInScope(req.store.sequelize, {
      hash,
      facilityIds: await requestFacilityScope(req),
    });

  // spec: BLAC, SCRUB
  // Corrupt content counts as not held, so neither probe nor fetch discloses it.
  const servableStat = async hash => await blobStore.servableStat(hash);

  // spec: AV
  // Under serve-only-when-known-good a facility can't fetch what central hasn't scanned, so a
  // scanner-less facility still holds only known-good content.
  const withheldReason = async (req, hash, stat) =>
    await blobServeGate({ settings: req.settings, models: req.store.models }, hash, stat);

  // spec: AV
  // Unlike a corrupt copy, a fresh copy of malware is not a repair.
  const isKnownBad = async (req, hash) =>
    Boolean(await req.store.models.BlobQuarantine.findOne({ where: { hash } }));

  // Must be indistinguishable from an out-of-scope hash.
  const blobNotHeld = hash =>
    new NotFoundError(`Blob not held: ${hash}`).withExtraData({
      availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
    });

  // Identical whether or not the content is held.
  const pushNotExpected = hash => new ForbiddenError(`Blob not expected: ${hash}`);

  // spec: XFER
  // Central never fetches, so absent bytes are always awaiting upload from their origin.
  routes.get(
    '/:hash/availability',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      // spec: BLAC
      const held = (await hashInScope(req, hash)) && (await servableStat(hash));
      if (!held) {
        res.send({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });
        return;
      }
      const withheld = await withheldReason(req, hash, held);
      if (withheld) {
        res.send({ availability: withheld });
        return;
      }
      res.send({ availability: BLOB_AVAILABILITY_STATES.AVAILABLE, size: held.size });
    }),
  );

  // spec: XFER
  routes.post(
    '/:hash/offer',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      // spec: BLAC
      // Before consulting the store, so an unexpected offer for held content is refused like one
      // for absent content.
      if (!(await hashInScope(req, hash))) {
        throw pushNotExpected(hash);
      }
      // spec: AV
      // Answered as already stored so the origin stops offering it rather than retrying a refusal.
      if (await isKnownBad(req, hash)) {
        res.send({ status: BLOB_OFFER_STATUSES.ALREADY_STORED });
        return;
      }
      // spec: SCRUB
      // A corrupt copy is wanted: central can't reach facilities on demand, so it takes
      // replacements when one offers.
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
  // Acknowledged only after verification and admission, so the origin can release its copy.
  routes.put(
    '/:hash/content',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      const { offset, totalSize } = await putContentQuerySchema.validate(req.query);

      // spec: BLAC
      // Refused from the first byte, so an unexpected hash is never even partially staged.
      if (!(await hashInScope(req, hash))) {
        throw pushNotExpected(hash);
      }

      // spec: AV
      // A quarantine can't be undone by pushing the same bytes again.
      if (await isKnownBad(req, hash)) {
        res.send({ acknowledged: true, existed: true });
        return;
      }

      // spec: SCRUB
      if (await servableStat(hash)) {
        res.send({ acknowledged: true, existed: true });
        return;
      }

      // Refuses an origin's excess before it reaches disk.
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
  routes.get(
    '/:hash',
    asyncHandler(async (req, res) => {
      const hash = validateHash(req.params.hash);
      // spec: BLAC
      // Same throw site as a not-held hash, so the responses can't drift apart.
      const held = (await hashInScope(req, hash)) && (await servableStat(hash));
      if (!held) {
        throw blobNotHeld(hash);
      }
      // spec: AV
      // Carries the reason, so the fetcher can tell pending content from content it will never get.
      const withheld = await withheldReason(req, hash, held);
      if (withheld) {
        throw new NotFoundError(`Blob not served: ${hash}`).withExtraData({
          availability: withheld,
        });
      }

      await serveBlob(req, res, {
        hash,
        size: held.size,
        open: range => blobStore.get(hash, { ...range, stat: held }),
      });
    }),
  );

  return routes;
};
