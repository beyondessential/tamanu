import { Router } from 'express';

import { fhirRoutes as matRoutes } from './materialised';
import {
  diagnosticReportHandler,
  immunizationHandler,
  patientHandler,
  singleDiagnosticReportHandler,
  singleImmunizationHandler,
  singlePatientHandler,
} from './routeHandlers';

import { requireClientHeaders as requireClientHeadersMiddleware } from '../middleware/requireClientHeaders';

export function fhirRoutes(ctx, { requireClientHeaders } = {}) {
  const routes = Router();

  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }

  // temporary: will replace this entire route once done
  routes.use('/mat', matRoutes(ctx));

  routes.get('/Patient', patientHandler());
  routes.get('/DiagnosticReport', diagnosticReportHandler());
  routes.get('/Immunization', immunizationHandler());

  routes.get('/Patient/:id', singlePatientHandler());
  routes.get('/DiagnosticReport/:id', singleDiagnosticReportHandler());
  routes.get('/Immunization/:id', singleImmunizationHandler());

  return routes;
}
