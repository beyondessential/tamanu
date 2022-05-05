import config from 'config';
import express from 'express';

import { patientHandler, diagnosticReportHandler } from '../../hl7fhir';
import { requireClientHeaders } from '../../middleware/requireClientHeaders';

export const routes = express.Router();

if (config.integrations.fijiVps.requireClientHeaders) {
  routes.use(requireClientHeaders);
}

routes.get('/Patient', patientHandler());
routes.get('/DiagnosticReport', diagnosticReportHandler());
