import express from 'express';

import { ForbiddenError } from 'shared/errors';
import { constructPermission } from 'shared/permissions/middleware';
import asyncHandler from 'express-async-handler';
import { createDataImporterEndpoint } from './importerEndpoint';

import { importer as programImporter, PERMISSIONS as PROGRAM_PERMISSIONS } from './programImporter';
import { importer as refdataImporter, PERMISSIONS as REFDATA_PERMISSIONS } from './refdataImporter';

import { mergePatientHandler } from './patientMerge';

export const adminRoutes = express.Router();

// Permission check on admin routes; not applied earlier in the handler stack as
// it might affect sync performance. Safe to remove once more general permission
// checks have been implemented.
adminRoutes.use(constructPermission);
adminRoutes.use(
  asyncHandler((req, res, next) => {
    if (!req.ability.can('manage', 'all')) {
      throw new ForbiddenError('Only admins can use central server admin functions.');
    }
    next();
  }),
);

adminRoutes.post(
  '/importRefData',
  createDataImporterEndpoint(refdataImporter, REFDATA_PERMISSIONS),
);

adminRoutes.post(
  '/importProgram',
  createDataImporterEndpoint(programImporter, PROGRAM_PERMISSIONS),
);

adminRoutes.post('/mergePatient', mergePatientHandler);
