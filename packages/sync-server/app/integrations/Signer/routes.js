import express from 'express';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
import { log } from 'shared/services/logging';
import { NotFoundError } from 'shared/errors';
import { loadCertificateIntoSigner } from '../VdsNc';

export const routes = express.Router();

routes.get(
  '/exportCertificateRequest',
  asyncHandler(async (req, res) => {
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
    const { Signer } = req.store.models;

    const signerData = await loadCertificateIntoSigner(req.body.certificate);
    const pending = await Signer.findPending();

    if (!pending) {
      throw new NotFoundError('Pending signer not found');
    }

    await pending.update(signerData);
    const start = moment(signerData.workingPeriodStart).format('YYYY-MM-DD');
    const end = moment(signerData.workingPeriodEnd).format('YYYY-MM-DD');
    log.info(`Loaded ICAO Signer (${start} - ${end})`);

    res.status(200).send({ message: `Loaded ICAO Signer (${start} - ${end})` });
  }),
);
