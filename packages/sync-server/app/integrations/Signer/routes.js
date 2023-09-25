import express from 'express';
import asyncHandler from 'express-async-handler';
import { format } from 'date-fns';
import { log } from 'shared/services/logging';
import { NotFoundError, ForbiddenError } from 'shared/errors';
import { loadCertificateIntoSigner } from './Crypto';

export const routes = express.Router();

// req.checkPermission isn't implemented on sync-server yet
// TODO: Swap this out when it is
function checkAdmin(user) {
  if (user?.role !== 'admin') {
    throw new ForbiddenError('Insufficient permissions');
  }
}

routes.get(
  '/exportCertificateRequest',
  asyncHandler(async (req, res) => {
    // req.checkPermission('read', 'Signer');
    checkAdmin(req.user);
    log.info('Exporting certificate request');
    const { Signer } = req.store.models;
    const pending = await Signer.findPending();

    if (pending) {
      res.status(200).send({ request: pending.request });
    } else {
      throw new NotFoundError('Pending signer not found');
    }
  }),
);

routes.post(
  '/importCertificate',
  asyncHandler(async (req, res) => {
    // req.checkPermission('write', 'Signer');
    checkAdmin(req.user);
    const { body, store, settings } = req;
    const { Signer } = store.models;

    const signerData = await loadCertificateIntoSigner(body.certificate, body.workingPeriod, {
      settings,
    });
    const pending = await Signer.findPending();

    if (!pending) {
      throw new NotFoundError('Pending signer not found');
    }

    await pending.update(signerData);
    const start = format(signerData.workingPeriodStart, 'yyyy-MM-dd');
    const end = format(signerData.workingPeriodEnd, 'yyyy-MM-dd');
    log.info(`Loaded ICAO Signer (${start} - ${end})`);

    res.status(200).send({ message: `Loaded ICAO Signer (${start} - ${end})` });
  }),
);
