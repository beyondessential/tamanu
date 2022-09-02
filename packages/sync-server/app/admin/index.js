import express from 'express';

import { ForbiddenError, NotFoundError } from 'shared/errors';
import { constructPermission } from 'shared/permissions/middleware';
import asyncHandler from 'express-async-handler';
import { createDataImporterEndpoint } from './importerEndpoint';

import { importer as programImporter, PERMISSIONS as PROGRAM_PERMISSIONS } from './programImporter';
import { importer as refdataImporter, PERMISSIONS as REFDATA_PERMISSIONS } from './refdataImporter';

import { mergePatientHandler } from './patientMerge';

export const adminRoutes = express.Router();

// Only construct permissions for the admin stack for now.
// The only reason this isn't applied earlier/more generally is
// because it might affect sync performance. This will be fine to
// remove once more general permission checks have been implemented.
adminRoutes.use(constructPermission);

adminRoutes.use(
  asyncHandler((req, res, next) => {
    if (!req.ability.can('write', 'ReferenceData') || !req.ability.can('write', 'User')) {
      throw new ForbiddenError('You do not have permission to access the central server admin panel.');
    }
    next();
  }),
);

adminRoutes.post('/mergePatient', mergePatientHandler);

// A temporary lookup-patient-by-displayId endpoint, just to 
// support patient merge because the patient search functionality is only
// available on LAN and there was some time pressure to get it out the door. 
// This should be replaced by the full-fledged patient search once some
// more consideration has been put into how that functionality should best
// be shared between the server modules.
adminRoutes.get('/lookup/patient/:displayId', asyncHandler(async (req, res) => {
  // Note there is no permission check for this endpoint as it's mounted under the 
  // admin routes
  const { Patient } = req.store.models;
  const { displayId } = req.params;
  const patient = await Patient.findOne({
    where: {
      displayId,
    },
    include: ['village'],
  });
  if (!patient) throw new NotFoundError(`Could not find patient with display ID ${displayId}.`);
  res.send(patient);
}));

adminRoutes.post(
  '/importRefData',
  createDataImporterEndpoint(refdataImporter, REFDATA_PERMISSIONS),
);

adminRoutes.post(
  '/importProgram',
  createDataImporterEndpoint(programImporter, PROGRAM_PERMISSIONS),
);
