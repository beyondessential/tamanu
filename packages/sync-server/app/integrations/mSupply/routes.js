import config from 'config';
import express from 'express';

import {
  patientHandler,
  diagnosticReportHandler,
  immunizationHandler,
  singlePatientHandler,
  singleDiagnosticReportHandler,
  singleImmunizationHandler,
} from '../../hl7fhir';
import { requireClientHeaders } from '../../middleware/requireClientHeaders';

export const routes = express.Router();

if (config.integrations.mSupply.requireClientHeaders) {
  routes.use(requireClientHeaders);
}

routes.get('/Patient', patientHandler());
routes.get('/DiagnosticReport', diagnosticReportHandler());
routes.get('/Immunization', immunizationHandler());

routes.get('/Patient/:id', singlePatientHandler());
routes.get('/DiagnosticReport/:id', singleDiagnosticReportHandler());
routes.get('/Immunization/:id', singleImmunizationHandler());
