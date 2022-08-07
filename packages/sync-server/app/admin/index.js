import express from 'express';

import { createDataImporterEndpoint } from './importerEndpoint';

import {
  importer as permissionsImporter,
  PERMISSIONS as PERMISSIONS_PERMISSIONS,
} from './permissionsImporter';
import { importer as programImporter, PERMISSIONS as PROGRAM_PERMISSIONS } from './programImporter';
import { importer as refdataImporter, PERMISSIONS as REFDATA_PERMISSIONS } from './refdataImporter';

export const adminRoutes = express.Router();

adminRoutes.post(
  '/importRefData',
  createDataImporterEndpoint(refdataImporter, REFDATA_PERMISSIONS),
);

adminRoutes.post(
  '/importPermissions',
  createDataImporterEndpoint(permissionsImporter, PERMISSIONS_PERMISSIONS),
);

adminRoutes.post(
  '/importProgram',
  createDataImporterEndpoint(programImporter, PROGRAM_PERMISSIONS),
);
