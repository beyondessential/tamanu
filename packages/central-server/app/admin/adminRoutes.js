import express from 'express';
import asyncHandler from 'express-async-handler';
import { unset } from 'lodash';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { InvalidParameterError, NotFoundError } from '@tamanu/errors';
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
import { designationRouter, designationsRouter } from './designations';
import { fhirJobStats } from './fhirJobStats';
import { mergePatientHandler } from './patientMerge';
import { templateRoutes } from './template';
import { reportsRouter } from './reports/reportRoutes';
import { syncLastCompleted } from './sync';
import { translationRouter } from './translation';
import { usersRouter } from './users';
import { userPreferencesRouter } from './userPreferences';
import { locationAssignmentsRouter } from './locationAssignments';
import { permissionsRouter } from './permissions';
import { roleRouter, rolesRouter } from './roles';
import { referenceDataManageRouter } from './referenceDataManage';

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
adminRoutes.use('/designations', designationsRouter);
adminRoutes.use('/designation', designationRouter);
adminRoutes.use('/users', usersRouter);
adminRoutes.use('/user', userPreferencesRouter);
adminRoutes.use('/location-assignments', locationAssignmentsRouter);
adminRoutes.use('/permissions', permissionsRouter);
adminRoutes.use('/referenceData/manage', referenceDataManageRouter);
adminRoutes.use('/roles', rolesRouter);
adminRoutes.use('/role', roleRouter);

// These settings endpoints are setup for viewing and saving the settings in the JSON editor in the admin panel.
// Both endpoints require an explicit `scope` so that we can resolve the schema
// and mask/encrypt secret fields. Without a scope we have no way to know which
// fields are secret, so allowing the call would silently bypass masking on read
// and encryption on write.
const requireScope = scope => {
  if (!scope) {
    throw new InvalidParameterError('scope is required');
  }
  const schema = getScopedSchema(scope);
  if (!schema) {
    throw new InvalidParameterError(`unknown scope: ${scope}`);
  }
  return schema;
};

adminRoutes.get(
  '/settings',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');
    const { Setting } = req.store.models;
    const { facilityId, scope } = req.query;
    const schema = requireScope(scope);

    const data = await Setting.get('', facilityId, scope);

    if (!data || typeof data !== 'object') {
      res.send(data);
      return;
    }

    const secretPaths = extractSecretPaths(schema);
    res.send(maskSecrets(data, secretPaths));
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
    const schema = requireScope(scope);

    if (!settings || typeof settings !== 'object') {
      res.json({ code: 200 });
      return;
    }

    const entries = flattenSettingsToEntries(settings);

    for (const entry of entries) {
      const settingDef = getSettingAtPath(schema, entry.path);
      if (!settingDef?.secret) continue;

      if (entry.value === SECRET_PLACEHOLDER) {
        // Unchanged — placeholder is what we returned to the client.
      } else if (entry.value === null || entry.value === undefined || entry.value === '') {
        // Admin cleared the field — delete the stored secret entirely so
        // the UI shows an empty field next time, not the placeholder.
        await Setting.unsetSecret(entry.path, scope, facilityId);
      } else {
        await Setting.setSecret(entry.path, entry.value, scope, facilityId);
      }
      // Always strip secrets from the regular settings object — they're
      // either unchanged or handled via setSecret/unsetSecret above.
      unset(settings, entry.path);
    }

    const remainingEntries = flattenSettingsToEntries(settings);
    if (remainingEntries.length > 0) {
      await Setting.set('', settings, scope, facilityId);
    }
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
