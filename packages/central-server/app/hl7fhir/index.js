import { Router } from 'express';
import { Problem } from '@tamanu/errors';

import {
  diagnosticReportHandler,
  immunizationHandler,
  patientHandler,
  singleDiagnosticReportHandler,
  singleImmunizationHandler,
  singlePatientHandler,
} from './routeHandlers';
import { fhirRoutes as matRoutes } from './materialised';

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

  routes.use((error, req, res, next) => {
    // "mat" fhir routes are handled by matRoutes' error handler
    if (res.headersSent) {
      return next(error);
    }

    // legacy "fhir" routes expect this error form
    const problem = Problem.fromError(error);
    res.status(problem?.status ?? 500).json({
      error: {
        message: problem.detail,
        ...error,
      },
    });
  });

  return routes;
}
