import express from 'express';

import { simplePost } from '@tamanu/shared/utils/crudHelpers';

export const certificateNotification = express.Router();

certificateNotification.post('/$', simplePost('CertificateNotification'));
