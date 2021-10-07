import express from 'express';
import config from 'config';

import { vrsRoutes } from './vaccineRegistrationSystem';

export const fijiRoutes = express.Router();
if (config.integrations.fiji.vrs.enabled) {
  fijiRoutes.use('/vrs', vrsRoutes);
}
