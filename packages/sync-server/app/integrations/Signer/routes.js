import express from 'express';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
import { log } from 'shared/services/logging';
import { loadCertificateIntoSigner } from '../VdsNc';

export const routes = express.Router();

routes.get(
  '/exportCertificateRequest',
  asyncHandler(async (req, res) => {
    log.info('Exporting certificate request');
    const { Signer } = req.store.models;
    const pending = await Signer.findPending();

    if (pending) {
      res
        .status(200)
        .attachment('request.csr')
        .send(pending.request);
    } else {
      res.status(404).send('Pending signer not found');
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
      throw new Error('No pending signer!');
    }

    await pending.update(signerData);
    const start = moment(signerData.workingPeriodStart).format('YYYY-MM-DD');
    const end = moment(signerData.workingPeriodEnd).format('YYYY-MM-DD');
    log.info(`Loaded ICAO Signer (${start} - ${end})`);

    res.status(200).send(`Loaded ICAO Signer (${start} - ${end})`);
  }),
);
