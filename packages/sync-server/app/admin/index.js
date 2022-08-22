import express from 'express';

import { createDataImporterEndpoint } from './importerEndpoint';

import { importer as programImporter, PERMISSIONS as PROGRAM_PERMISSIONS } from './programImporter';
import { importer as refdataImporter, PERMISSIONS as REFDATA_PERMISSIONS } from './refdataImporter';

import { mergePatientHandler } from './patientMerge';

export const adminRoutes = express.Router();

adminRoutes.post(
  '/importRefData',
  createDataImporterEndpoint(refdataImporter, REFDATA_PERMISSIONS),
);

adminRoutes.post(
  '/importProgram',
  createDataImporterEndpoint(programImporter, PROGRAM_PERMISSIONS),
);

adminRoutes.post(
  '/mergePatient',
  mergePatientHandler,
);