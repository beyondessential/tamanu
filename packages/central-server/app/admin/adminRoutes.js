import express from 'express';
import asyncHandler from 'express-async-handler';
import { unset, get as getAtPath, set as setAtPath } from 'lodash';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { InvalidParameterError, NotFoundError } from '@tamanu/errors';
import { simplePatch } from '@tamanu/shared/utils/crudHelpers';
import {
  settingsCache,
  getScopedSchema,
  extractSecretPaths,
  maskSecrets,
  SECRET_PLACEHOLDER,
} from '@tamanu/settings';
import { encryptSecret, getSettingsPskKeyBuffer } from '@tamanu/shared/utils/crypto';

import { exporterRouter } from './exporter';
import { importerRouter } from './importer';

import { assetRoutes } from './asset';
import { designationRouter, designationsRouter } from './designations';
import { fhirJobStats } from './fhirJobStats';
import { locationAssignmentsRouter } from './locationAssignments';
import { mergePatientHandler } from './patientMerge';
import { permissionsRouter } from './permissions';
import { programRouter, programsRouter } from './programs';
import { programRegistryRouter, programRegistriesRouter } from './programRegistries';
import { referenceDataManageRouter } from './referenceDataManage';
import { reportsRouter } from './reports/reportRoutes';
import { roleRouter, rolesRouter } from './roles';
import { syncLastCompleted } from './sync';
import { templateRoutes } from './template';
import { translationRouter } from './translation';
import { userPreferencesRouter } from './userPreferences';
import { usersRouter } from './users';

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
adminRoutes.use('/programs', programsRouter);
adminRoutes.use('/program', programRouter);
adminRoutes.use('/programRegistries', programRegistriesRouter);
adminRoutes.use('/programRegistry', programRegistryRouter);
adminRoutes.patch(
  '/programRegistryClinicalStatus/:id',
  simplePatch('ProgramRegistryClinicalStatus', {
    allowedFields: ['color', 'name', 'visibilityStatus'],
  }),
);
adminRoutes.patch(
  '/programRegistryCondition/:id',
  simplePatch('ProgramRegistryCondition', { allowedFields: ['name', 'visibilityStatus'] }),
);
adminRoutes.patch(
  '/programRegistryConditionCategory/:id',
  simplePatch('ProgramRegistryConditionCategory', {
    allowedFields: ['name', 'visibilityStatus'],
  }),
);
adminRoutes.use('/referenceData/manage', referenceDataManageRouter);
adminRoutes.use('/roles', rolesRouter);
adminRoutes.use('/role', roleRouter);
adminRoutes.patch(
  '/survey/:id',
  simplePatch('Survey', {
    allowedFields: [
      'isSensitive',
      'name',
      'notifiable',
      'notifyEmailAddresses',
      'surveyType',
      'visibilityStatus',
    ],
  }),
);

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
 * Resolves secret fields in `settings` so the object can be safely passed to
 * Setting.set('', ...) as a single bulk write. Setting.set with an empty key
 * soft-deletes any row in scope that isn't in its records, so handling secrets
 * via separate setSecret/unsetSecret calls around the bulk write would lose
 * the freshly-written secret rows. Instead, for each schema-declared secret
 * path we mutate `settings` in place:
 *   - encrypt new plaintext values
 *   - replace SECRET_PLACEHOLDER (unchanged) with the existing encrypted DB
 *     value, so the bulk write's isEqual check leaves the row alone
 *   - remove empty/null entries so the bulk cleanup soft-deletes them
 */
async function resolveSecretsForSave(Setting, settings, schema, scope, facilityId) {
  const secretPaths = extractSecretPaths(schema);
  if (secretPaths.length === 0) return;

  let keyBuffer;
  for (const path of secretPaths) {
    const value = getAtPath(settings, path);
    if (value === undefined) continue;

    if (value === SECRET_PLACEHOLDER) {
      const existing = await Setting.findOne({
        where: { key: path, scope, facilityId },
      });
      if (existing) {
        setAtPath(settings, path, existing.value);
      } else {
        unset(settings, path);
      }
      continue;
    }

    if (value === null || value === '') {
      unset(settings, path);
      continue;
    }

    if (!keyBuffer) keyBuffer = await getSettingsPskKeyBuffer();
    setAtPath(settings, path, await encryptSecret(keyBuffer, String(value)));
  }
}

adminRoutes.put(
  '/settings',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Setting');
    const { Setting } = req.store.models;
    const { settings, scope, facilityId = null } = req.body;
    const schema = requireScope(scope);

    if (!settings || typeof settings !== 'object') {
      res.json({ code: 200 });
      return;
    }

    await resolveSecretsForSave(Setting, settings, schema, scope, facilityId);
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
