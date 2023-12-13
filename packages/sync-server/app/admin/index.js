import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { createDataImporterEndpoint } from './importerEndpoint';

import { exporter } from './exporter';
import { programImporter } from './programImporter';
import { referenceDataImporter } from './referenceDataImporter';

import { assetRoutes } from './asset';
import { fhirJobStats } from './fhirJobStats';
import { patientLetterTemplateRoutes } from './patientLetterTemplate';
import { mergePatientHandler } from './patientMerge';
import { reportsRouter } from './reports/reportRoutes';
import { syncLastCompleted } from './sync';

export const adminRoutes = express.Router();

// Only construct permissions for the admin stack for now.
// The only reason this isn't applied earlier/more generally is
// because it might affect sync performance. This will be fine to
// remove once more general permission checks have been implemented.
adminRoutes.use(constructPermission);

adminRoutes.use(
  asyncHandler((req, res, next) => {
    if (!req.ability.can('write', 'ReferenceData') || !req.ability.can('write', 'User')) {
      throw new ForbiddenError(
        'You do not have permission to access the central server admin panel.',
      );
    }
    next();
  }),
);

adminRoutes.use('/reports', reportsRouter);
adminRoutes.post('/mergePatient', mergePatientHandler);

// A temporary lookup-patient-by-displayId endpoint, just to
// support patient merge because the patient search functionality is only
// available on LAN and there was some time pressure to get it out the door.
// This should be replaced by the full-fledged patient search once some
// more consideration has been put into how that functionality should best
// be shared between the server modules.
adminRoutes.get(
  '/lookup/patient/:displayId',
  asyncHandler(async (req, res) => {
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
  }),
);

adminRoutes.post('/import/referenceData', createDataImporterEndpoint(referenceDataImporter));

adminRoutes.post('/import/program', createDataImporterEndpoint(programImporter));

adminRoutes.get(
  '/export/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const filename = await exporter(store.models, query.includedDataTypes);
    res.download(filename);
  }),
);

adminRoutes.get('/sync/lastCompleted', syncLastCompleted);

adminRoutes.get('/fhir/jobStats', fhirJobStats);

adminRoutes.use('/patientLetterTemplate', patientLetterTemplateRoutes);

adminRoutes.use('/asset', assetRoutes);
