import { resolve } from 'node:path';
import { Command } from 'commander';
import { defaultsDeep, keyBy } from 'lodash';
import { Op } from 'sequelize';
import { readFile, utils } from 'xlsx';

import {
  GENERAL_IMPORTABLE_DATA_TYPES,
  PERMISSION_IMPORTABLE_DATA_TYPES,
  SETTINGS_SCOPES,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { initDatabase } from '../database';
import { checkIntegrationsConfig } from '../integrations';
import { loadSettingFile } from '../utils/loadSettingFile';
import { referenceDataImporter } from '../admin/referenceDataImporter';
import { normaliseSheetName } from '../admin/importer/importerEndpoint';
import { getRandomBase64String } from '../auth/utils';
import { programImporter } from '../admin/programImporter/programImporter';

/**
 * Validates that a reference data file contains all sheets importable through the reference data importer
 * @param {string} file - File path
 */
function validateFullReferenceDataImport(file) {
  // These are two very unique cases. 'user' has special logic and 'administeredVaccine' is a special case used for existing deployments.
  const EXCLUDED_FROM_FULL_IMPORT_CHECK = ['user', 'administeredVaccine'];

  log.debug('Parse XLSX workbook for validation');
  const workbook = readFile(file);
  const sheetNameDictionary = keyBy(Object.keys(workbook.Sheets), normaliseSheetName);

  // Check all required data types are present and have data
  const missingDataTypes = [];
  for (const dataType of GENERAL_IMPORTABLE_DATA_TYPES) {
    if (EXCLUDED_FROM_FULL_IMPORT_CHECK.includes(dataType)) continue;
    const sheetName = sheetNameDictionary[dataType];
    if (!sheetName || utils.sheet_to_json(workbook.Sheets[sheetName]).length === 0) {
      missingDataTypes.push(dataType);
    }
  }

  if (missingDataTypes.length > 0) {
    throw new Error(
      `Reference data file has no rows for the following data types:\n${missingDataTypes.join('\n')}`,
    );
  }

  log.info('Reference data file validation passed - all required sheets contain data');
}

export async function provision(provisioningFile, { skipIfNotNeeded }) {
  const store = await initDatabase({ testMode: false });
  const userCount = await store.models.User.count({
    where: {
      id: { [Op.ne]: SYSTEM_USER_UUID },
    },
  });

  if (userCount > 0) {
    if (skipIfNotNeeded) {
      log.info(
        `Found ${userCount} users already in the database, but expecting to, not provisioning`,
      );
      return;
    }

    throw new Error(`Found ${userCount} users already in the database, aborting provision`);
  }

  checkIntegrationsConfig();

  const {
    users = {},
    facilities = {},
    programs = [],
    referenceData = [],
    settings = {},
  } = await loadSettingFile(provisioningFile);

  /// //////////////
  /// REFERENCE DATA

  const errors = [];
  const stats = [];

  const importerOptions = {
    errors,
    models: store.models,
    stats,
    includedDataTypes: [...GENERAL_IMPORTABLE_DATA_TYPES, ...PERMISSION_IMPORTABLE_DATA_TYPES],
    checkPermission: () => true,
  };

  for (const {
    file: referenceDataFile = null,
    url: referenceDataUrl = null,
    defaultSpreadsheet: isUsingDefaultSpreadsheet = false,
    ...rest
  } of referenceData ?? []) {
    if (isUsingDefaultSpreadsheet) {
      const defaultReferenceDataFile = resolve(__dirname, 'default-provisioning.xlsx');
      log.info('Using reference data spreadsheet from this branch', {
        file: defaultReferenceDataFile,
      });
      // We only validate the default import to ensure it stays complete. It is fine to allow partial imports through the other options.
      validateFullReferenceDataImport(defaultReferenceDataFile);
      await referenceDataImporter({
        file: defaultReferenceDataFile,
        ...importerOptions,
      });
    }

    if (!referenceDataFile && !referenceDataUrl && !isUsingDefaultSpreadsheet) {
      throw new Error(`Unknown reference data import with keys ${Object.keys(rest).join(', ')}`);
    }

    if (referenceDataFile) {
      const realpath = resolve(provisioningFile, referenceDataFile);
      log.info('Importing reference data file', { file: realpath });
      await referenceDataImporter({
        file: realpath,
        ...importerOptions,
      });
    } else if (referenceDataUrl) {
      log.info('Downloading reference data file', { url: referenceDataUrl });
      const file = await fetch(referenceDataUrl);
      const data = Buffer.from(await (await file.blob()).arrayBuffer());
      log.info('Importing reference data', { size: data.byteLength });
      await referenceDataImporter({
        data,
        file: referenceDataUrl,
        ...importerOptions,
      });
    }
  }

  if (errors.length) {
    for (const error of errors) {
      log.error(error);
    }
    throw new Error(`Encountered ${errors.length} errors during provisioning`);
  }

  log.info('Imported reference data successfully', stats);

  /// //////////
  /// FACILITIES

  for (const [id, value] of Object.entries(facilities)) {
    const fields = { ...value };
    delete fields.user;
    delete fields.password;
    delete fields.settings;

    const facility = await store.models.Facility.findByPk(id);
    if (facility) {
      log.info('Updating facility', { id });
      await facility.update(fields);
    } else {
      log.info('Creating facility', { id });
      fields.name ||= id;
      fields.code ||= id;
      await store.models.Facility.create({
        id,
        ...fields,
      });
    }
  }

  /// ////////
  /// SETTINGS

  const combineSettings = async (settingData, scope, facilityId) => {
    const existing = await store.models.Setting.get('', facilityId, scope);
    const combined = defaultsDeep(settingData, existing);
    return store.models.Setting.set('', combined, scope, facilityId);
  };

  if (settings.global) {
    await combineSettings(settings.global, SETTINGS_SCOPES.GLOBAL);
    log.info('Set global settings');
  }
  if (settings.facilities) {
    await Promise.all(
      Object.entries(settings.facilities).map(([facilityId, facilitySettings]) =>
        combineSettings(facilitySettings, SETTINGS_SCOPES.FACILITY, facilityId),
      ),
    );
    log.info('Set facility settings');
  }
  if (settings.central) {
    await combineSettings(settings.central, SETTINGS_SCOPES.CENTRAL);
    log.info('Set central settings');
  }

  /// /////
  /// USERS

  const allUsers = [
    ...Object.entries(users),
    ...Object.entries(facilities)
      .map(
        ([id, { user, password }]) =>
          user && password && [user, { displayName: `System: ${id} sync`, password }],
      )
      .filter(Boolean),
  ];

  for (const [email, { role = 'admin', password, ...fields }] of allUsers) {
    let realPassword = password;
    if (!realPassword) {
      realPassword = getRandomBase64String(16);
      // eslint-disable-next-line no-console
      console.log(`NEW PASSWORD for ${email}: ${realPassword}`);
    }

    const user = await store.models.User.findOne({ where: { email } });
    if (user) {
      log.info('Updating user', { email });
      user.set({ role, ...fields });
      user.setPassword(realPassword);
      await user.save();
    } else {
      log.info('Creating user', { email });
      await store.models.User.create({
        email,
        role,
        password: realPassword,
        ...fields,
      });
    }
  }

  /// ////////
  /// PROGRAMS

  const programOptions = { errors, models: store.models, stats, checkPermission: () => true };

  for (const { file: programFile = null, url: programUrl = null, ...rest } of programs) {
    if (!programFile && !programUrl) {
      throw new Error(`Unknown program import with keys ${Object.keys(rest).join(', ')}`);
    }

    if (programFile) {
      const realpath = resolve(provisioningFile, programFile);
      log.info('Importing program file', { file: realpath });
      await programImporter({
        file: realpath,
        ...programOptions,
      });
    } else if (programUrl) {
      log.info('Downloading program file', { url: programUrl });
      const file = await fetch(programUrl);
      const data = Buffer.from(await (await file.blob()).arrayBuffer());
      log.info('Importing program', { size: data.byteLength });
      await programImporter({
        data,
        file: programUrl,
        ...programOptions,
      });
    }
  }

  if (errors.length) {
    for (const error of errors) {
      log.error(error);
    }
    throw new Error(`Encountered ${errors.length} errors during provisioning`);
  }

  log.info('Imported programs successfully', stats);

  log.info('Done.');
}

export const provisionCommand = new Command('provision')
  .description(
    'Set up initial data. See https://beyond-essential.slab.com/posts/tamanu-provisioning-file-h1urgi86 for details or /docs/provisioning/example.json5 for a sample file.',
  )
  .argument('<file>', 'Path to the provisioning file')
  .option(
    '--skip-if-not-needed',
    'If there are already users in the database, exit(0) instead of aborting',
  )
  .action(provision);
