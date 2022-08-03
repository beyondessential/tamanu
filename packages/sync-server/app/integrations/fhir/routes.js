import express from 'express';

import { patientHandler, diagnosticReportHandler, immunizationHandler } from '../../hl7fhir';

export const routes = express.Router();

routes.get('/Patient', patientHandler());
routes.get('/DiagnosticReport', diagnosticReportHandler());
routes.get('/Immunization', immunizationHandler());
