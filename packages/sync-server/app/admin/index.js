import express from 'express';

import { createDataImporterEndpoint } from './importerEndpoint';
import refdataImporter, { PERMISSIONS as REFDATA_PERMISSIONS } from './refdataImporter';
import permissionsImporter, { PERMISSIONS as PERMISSIONS_PERMISSIONS } from './permissionsImporter';
import programImporter, { PERMISSIONS as PROGRAM_PERMISSIONS } from './programImporter';

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
