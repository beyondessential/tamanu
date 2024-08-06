import express from 'express';
import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { NotFoundError } from '@tamanu/shared/errors';
import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';

import { createDataImporterEndpoint } from './importerEndpoint';
import { programImporter } from './programImporter';
import { referenceDataImporter } from './referenceDataImporter';
import { surveyResponsesImporter } from './surveyResponsesImporter';
import { exporter } from './exporter';

import { mergePatientHandler } from './patientMerge';
import { syncLastCompleted } from './sync';
import { fhirJobStats } from './fhirJobStats';
import { reportsRouter } from './reports/reportRoutes';
import { templateRoutes } from './template';
import { assetRoutes } from './asset';
import { translationRouter } from './translation';
import { exportProgram } from './programExporter/exportProgram';
import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import { insurerPaymentImporter } from './invoice/insurerPaymentImporter';

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

adminRoutes.post('/import/insurerPayments', createDataImporterEndpoint(insurerPaymentImporter));

adminRoutes.get(
  '/export/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const { includedDataTypes = {} } = query;

    for (const dataType of Object.values(includedDataTypes)) {
      // When it is ReferenceData, check if user has permission to list ReferenceData
      if (['diagnosis', ...REFERENCE_TYPE_VALUES].includes(dataType)) {
        req.checkPermission('list', 'ReferenceData');
        continue;
      }

      // Otherwise, if it is other types (eg: patient, lab_test_types,... ones that have their own models)
      // check the permission against the models
      const nonReferenceDataModelName = upperFirst(dataType);
      req.checkPermission('list', nonReferenceDataModelName);
    }

    const filename = await exporter(store, query.includedDataTypes);
    res.download(filename);
  }),
);

adminRoutes.get(
  '/export/program/:programId',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Program');

    const { store } = req;
    const { programId } = req.params;

    const filename = await exportProgram(store, programId);
    res.download(filename);
  }),
);

adminRoutes.get('/programs', simpleGetList('Program'));

adminRoutes.get('/sync/lastCompleted', syncLastCompleted);

adminRoutes.get('/fhir/jobStats', fhirJobStats);

adminRoutes.use('/template', templateRoutes);

adminRoutes.use('/asset', assetRoutes);

// These settings endpoints are setup for viewing and saving the settings in the JSON editor in the admin panel
adminRoutes.get(
  '/settings',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');
    const { Setting } = req.store.models;
    const data = await Setting.get('', req.query.facilityId, req.query.scope);
    res.send(data);
  }),
);

adminRoutes.put(
  '/settings',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Setting');
    const { Setting } = req.store.models;
    await Setting.set('', req.body.settings, req.body.scope, req.body.facilityId);
    res.json({ code: 200 });
  }),
);

adminRoutes.delete(
  '/settings/cache',
  asyncHandler(async (req, res) => {
    req.checkPermission('manage', 'all');
    settingsCache.reset();
    res.status(204).send();
  }),
);

adminRoutes.get(
  '/facilities',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Facility');
    const { Facility } = req.store.models;
    const data = await Facility.findAll({ attributes: ['id', 'name'] });
    res.send(data);
  }),
);
