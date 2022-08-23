import express from 'express';

import {
  patientHandler,
  diagnosticReportHandler,
  immunizationHandler,
  singlePatientHandler,
  singleDiagnosticReportHandler,
  singleImmunizationHandler,
} from '../../hl7fhir';

export const routes = express.Router();

routes.get('/Patient', patientHandler());
routes.get('/DiagnosticReport', diagnosticReportHandler());
routes.get('/Immunization', immunizationHandler());

routes.get('/Patient/:id', singlePatientHandler());
routes.get('/DiagnosticReport/:id', singleDiagnosticReportHandler());
routes.get('/Immunization/:id', singleImmunizationHandler());
