import express from 'express';
import asyncHandler from 'express-async-handler';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { NotFoundError } from '@tamanu/errors';
import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import { settingsCache } from '@tamanu/settings';

import { exporterRouter } from './exporter';
import { importerRouter } from './importer';

import { assetRoutes } from './asset';
import { fhirJobStats } from './fhirJobStats';
import { mergePatientHandler } from './patientMerge';
import { templateRoutes } from './template';
import { reportsRouter } from './reports/reportRoutes';
import { syncLastCompleted } from './sync';
import { translationRouter } from './translation';
import { usersRouter } from './users';
import { userPreferencesRouter } from './userPreferences';
import { locationAssignmentsRouter } from './locationAssignments';

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

    await req.audit.access({
      recordId: patient.id,
      frontEndContext: req.params,
      model: Patient,
    });

    res.send(patient);
  }),
);

adminRoutes.use('/import', importerRouter);
adminRoutes.use('/export', exporterRouter);

adminRoutes.get('/programs', simpleGetList('Program'));

adminRoutes.get('/sync/lastCompleted', syncLastCompleted);

adminRoutes.get('/fhir/jobStats', fhirJobStats);

adminRoutes.use('/template', templateRoutes);

adminRoutes.use('/asset', assetRoutes);
adminRoutes.use('/users', usersRouter);
adminRoutes.use('/user', userPreferencesRouter);
adminRoutes.use('/location-assignments', locationAssignmentsRouter);

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
    req.flagPermissionChecked(); // No permission check needed - users should be able to see all facilities
    const { Facility } = req.store.models;
    const data = await Facility.findAll({ attributes: ['id', 'name'] });
    res.send(data);
  }),
);
