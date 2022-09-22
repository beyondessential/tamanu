import { Router } from 'express';

import {
  patientHandler,
  diagnosticReportHandler,
  immunizationHandler,
  singlePatientHandler,
  singleDiagnosticReportHandler,
  singleImmunizationHandler,
} from './routeHandlers';
import { resourceHandler } from './materialisedHandlers';

import { requireClientHeaders as requireClientHeadersMiddleware } from '../middleware/requireClientHeaders';

export function fhirRoutes({ requireClientHeaders } = {}) {
  const routes = Router();

  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }
  
  routes.get('/mat/Patient', resourceHandler('Patient'));

  routes.get('/Patient', patientHandler());
  routes.get('/DiagnosticReport', diagnosticReportHandler());
  routes.get('/Immunization', immunizationHandler());

  routes.get('/Patient/:id', singlePatientHandler());
  routes.get('/DiagnosticReport/:id', singleDiagnosticReportHandler());
  routes.get('/Immunization/:id', singleImmunizationHandler());

  return routes;
}
