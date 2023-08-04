import { resolve } from 'path';
import { Command } from 'commander';

import {
  SYSTEM_USER_UUID,
  GENERAL_IMPORTABLE_DATA_TYPES,
  PERMISSION_IMPORTABLE_DATA_TYPES,
} from '@tamanu/shared/constants';
import { log } from '@tamanu/shared/services/logging';

import { initDatabase } from '../database';
import { checkIntegrationsConfig } from '../integrations';
import { loadSettingFile } from '../utils/loadSettingFile';
import { referenceDataImporter } from '../admin/referenceDataImporter';
import { getRandomBase64String } from '../auth/utils';

export async function provision({ file: provisioningFile, skipIfNotNeeded }) {
  const store = await initDatabase({ testMode: false });
  const userCount = await store.models.User.count();
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

  const { users, facilities, referenceData, settings: globalSettings } = await loadSettingFile(
    provisioningFile,
  );

  /// //////////////
  /// REFERENCE DATA

  const errors = [];
  const stats = [];
  for (const { file: referenceDataFile, ...rest } of referenceData ?? []) {
    if (!referenceDataFile) {
      throw new Error(`Unknown reference data import with keys ${Object.keys(rest).join(', ')}`);
    }

    const realpath = resolve(provisioningFile, referenceDataFile);
    log.info('Importing reference data file', { file: realpath });
    await referenceDataImporter({
      errors,
      models: store.models,
      stats,
      file: realpath,
      includedDataTypes: [...GENERAL_IMPORTABLE_DATA_TYPES, ...PERMISSION_IMPORTABLE_DATA_TYPES],
    });
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

  for (const [id, { user, password, settings, ...fields }] of Object.entries(facilities ?? {})) {
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

  for (const [key, value] of Object.entries(globalSettings ?? {})) {
    log.info('Installing global setting', { key });
    await store.models.Setting.set(key, value);
  }

  for (const [id, { settings }] of Object.entries(facilities ?? {})) {
    for (const [key, value] of Object.entries(settings ?? {})) {
      log.info('Installing facility setting', { key, facility: id });
      await store.models.Setting.set(key, value, id);
    }
  }

  /// /////
  /// USERS

  const allUsers = [
    ...Object.entries(users ?? {}),
    ...Object.entries(facilities ?? {})
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

  log.info('Creating system user');
  await store.models.User.create({
    id: SYSTEM_USER_UUID,
    email: 'system@tamanu.io',
    role: 'system',
    displayName: 'System',
  });

  log.info(`Done.`);
}

export const provisionCommand = new Command('provision')
  .description(
    'Set up initial data. See https://beyond-essential.slab.com/posts/tamanu-provisioning-file-h1urgi86 for details or /docs/provisioning/example.kdl for a sample file.',
  )
  .argument('<file>', 'Path to the provisioning file')
  .option(
    '--skip-if-not-needed',
    'If there are already users in the database, exit(0) instead of aborting',
  )
  .action(provision);
