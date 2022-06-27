import config from 'config';
import express from 'express';

import { patientHandler } from '../../hl7fhir';
import { requireClientHeaders } from '../../middleware/requireClientHeaders';

export const routes = express.Router();

if (config.integrations.mSupply.requireClientHeaders) {
  routes.use(requireClientHeaders);
}

routes.get('/Patient', patientHandler());
