import express from 'express';
import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { NotFoundError } from '@tamanu/shared/errors';
import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';

import { createDataImporterEndpoint } from './importerEndpoint';

import { programImporter } from './programImporter';
import { referenceDataImporter } from './referenceDataImporter';
import { surveyResponsesImporter } from './surveyResponsesImporter';
import { exporter } from './exporter';

import { mergePatientHandler } from './patientMerge';
import { syncLastCompleted } from './sync';
import { fhirJobStats } from './fhirJobStats';
import { reportsRouter } from './reports/reportRoutes';
import { patientLetterTemplateRoutes } from './patientLetterTemplate';
import { assetRoutes } from './asset';
import { translationRouter } from './translation';

export const adminRoutes = express.Router();
adminRoutes.use(ensurePermissionCheck);
adminRoutes.use('/reports', reportsRouter);
adminRoutes.use('/translation', translationRouter);
adminRoutes.post('/mergePatient', mergePatientHandler);

// A temporary lookup-patient-by-displayId endpoint, just to
// support patient merge because the patient search functionality is only
// available on Facility and there was some time pressure to get it out the door.
// This should be replaced by the full-fledged patient search once some
// more consideration has been put into how that functionality should best
// be shared between the server modules.
adminRoutes.get(
  '/lookup/patient/:displayId',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

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

adminRoutes.post('/import/surveyResponses', createDataImporterEndpoint(surveyResponsesImporter));

adminRoutes.get(
  '/export/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const { includedDataTypes = [] } = query;

    for (const dataType of includedDataTypes) {
      if (REFERENCE_TYPE_VALUES.includes(dataType)) {
        req.checkPermission('list', 'ReferenceData');
        continue;
      }
  
      const nonReferenceDataModelName = upperFirst(dataType);
      req.checkPermission('list', nonReferenceDataModelName);
    }

    const filename = await exporter(store, query.includedDataTypes);
    res.download(filename);
  }),
);

adminRoutes.get('/sync/lastCompleted', syncLastCompleted);

adminRoutes.get('/fhir/jobStats', fhirJobStats);

adminRoutes.use('/patientLetterTemplate', patientLetterTemplateRoutes);

adminRoutes.use('/asset', assetRoutes);
