import express from 'express';
import asyncHandler from 'express-async-handler';

import { ForbiddenError, NotFoundError } from 'shared/errors';
import { createDataImporterEndpoint } from './importerEndpoint';

import { programImporter } from './programImporter';
import { referenceDataImporter } from './referenceDataImporter';
import { exporter } from './exporter';

import { mergePatientHandler } from './patientMerge';
import { syncLastCompleted } from './sync';
import { reportsRouter } from './reports/reportRoutes';
import { patientLetterTemplateRoutes } from './patientLetterTemplate';
import { assetRoutes } from './asset';

export const adminRoutes = express.Router();

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

adminRoutes.use('/patientLetterTemplate', patientLetterTemplateRoutes);

adminRoutes.use('/asset', assetRoutes);
