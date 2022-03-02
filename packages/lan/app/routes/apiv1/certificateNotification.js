import express from 'express';

import { simplePost } from './crudHelpers';

export const certificateNotification = express.Router();

certificateNotification.post('/$', simplePost('CertificateNotification'));
