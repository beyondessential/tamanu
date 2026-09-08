import express from 'express';

import { simplePost } from '@tamanu/shared/utils/crudHelpers';

export const certificateNotification = express.Router();

const createCertificateNotification = simplePost('CertificateNotification', {
  allowedFields: [
    'createdBy',
    'facilityName',
    'forwardAddress',
    'language',
    'patientId',
    'printedDate',
    'type',
  ],
});

// The request's language is part of the record, so it goes into the body the handler filters.
certificateNotification.post('/', (req, res, next) => {
  req.body = { ...req.body, language: req.language };
  return createCertificateNotification(req, res, next);
});
