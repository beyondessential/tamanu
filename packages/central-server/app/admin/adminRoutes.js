import express from 'express';
import asyncHandler from 'express-async-handler';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { NotFoundError } from '@tamanu/errors';
import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import {
  settingsCache,
  getScopedSchema,
  extractSecretPaths,
  maskSecrets,
  SECRET_PLACEHOLDER,
  getSettingAtPath,
} from '@tamanu/settings';

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
    const { facilityId, scope } = req.query;

    const data = await Setting.get('', facilityId, scope);

    // If no scope provided or no data, return as-is
    if (!scope || !data || typeof data !== 'object') {
      res.send(data);
      return;
    }

    // Mask secret values before sending to the client
    const schema = getScopedSchema(scope);
    if (schema) {
      const secretPaths = extractSecretPaths(schema);
      const maskedData = maskSecrets(data, secretPaths);
      res.send(maskedData);
    } else {
      res.send(data);
    }
  }),
);

/**
 * Flattens a nested settings object into an array of { path, value } entries.
 * e.g., { a: { b: 'val' } } => [{ path: 'a.b', value: 'val' }]
 */
function flattenSettingsToEntries(obj, parentPath = '') {
  const entries = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = parentPath ? `${parentPath}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenSettingsToEntries(value, fullPath));
    } else {
      entries.push({ path: fullPath, value });
    }
  }

  return entries;
}

adminRoutes.put(
  '/settings',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Setting');
    const { Setting } = req.store.models;
    const { settings, scope, facilityId } = req.body;

    // Get the schema to identify secret fields
    const schema = scope ? getScopedSchema(scope) : null;

    if (schema && settings && typeof settings === 'object') {
      const secretPaths = extractSecretPaths(schema);

      // Process settings to handle secrets
      const entries = flattenSettingsToEntries(settings);

      for (const entry of entries) {
        const settingDef = getSettingAtPath(schema, entry.path);

        if (settingDef?.secret && secretPaths.includes(entry.path)) {
          // If the value is the placeholder, the user didn't change it - skip updating this field
          if (entry.value === SECRET_PLACEHOLDER) {
            // Remove from settings so it doesn't overwrite the existing value
            const pathParts = entry.path.split('.');
            let current = settings;
            for (let i = 0; i < pathParts.length - 1; i++) {
              current = current[pathParts[i]];
            }
            delete current[pathParts[pathParts.length - 1]];
          } else if (entry.value !== null && entry.value !== undefined) {
            // Encrypt the secret value before storing (empty strings are valid secrets)
            await Setting.setSecret(entry.path, entry.value, scope, facilityId);
            // Remove from regular settings so it's not double-stored
            const pathParts = entry.path.split('.');
            let current = settings;
            for (let i = 0; i < pathParts.length - 1; i++) {
              current = current[pathParts[i]];
            }
            delete current[pathParts[pathParts.length - 1]];
          }
        }
      }
    }

    // Save non-secret settings normally
    await Setting.set('', settings, scope, facilityId);
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
