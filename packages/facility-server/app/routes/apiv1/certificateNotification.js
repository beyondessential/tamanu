import express from 'express';

import { simplePost } from '@tamanu/shared/utils/crudHelpers';

export const certificateNotification = express.Router();

certificateNotification.post('/$', (req, res) => {
  const { language } = req;
  req.body = { ...req.body, language }
  return simplePost('CertificateNotification')(req, res);
});
