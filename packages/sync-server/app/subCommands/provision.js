import { relative } from 'path';
import { Command } from 'commander';

import { UUID_NIL } from 'shared/constants';
import { log } from 'shared/services/logging';

import { initDatabase } from '../database';
import { checkIntegrationsConfig } from '../integrations';
import { loadSettingFile } from '../utils/loadSettingFile';
import { referenceDataImporter } from '../admin/referenceDataImporter';
import { getRandomBase64String } from '../auth/utils';

export async function provision({ file, skipIfNotNeeded }) {
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
    file,
  );

  /// //////////////
  /// REFERENCE DATA

  const errors = [];
  const stats = {};
  for (const [type, path] of referenceData) {
    if (type !== 'file') throw new Error(`Unknown reference data import type ${type}`);

    const realpath = relative(file, path);
    log.info('Importing reference data file', { file: realpath });
    await referenceDataImporter({
      errors,
      models: store.models,
      stats,
      file: realpath,
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

  for (const [id, { user, password, settings, ...fields }] of Object.entries(facilities)) {
    const facility = await store.models.Facility.findByPk(id);
    if (facility) {
      log.info('Updating facility', { id });
      await facility.update(fields);
    } else {
      log.info('Creating facility', { id });
      await store.models.Facility.create({
        id,
        ...fields,
      });
    }
  }

  /// ////////
  /// SETTINGS

  for (const [key, value] of Object.entries(globalSettings)) {
    log.info('Installing global setting', { key });
    await store.models.Setting.set(key, value);
  }

  for (const [id, { settings }] of Object.entries(facilities)) {
    for (const [key, value] of Object.entries(settings)) {
      log.info('Installing facility setting', { key, facility: id });
      await store.models.Setting.set(key, value, id);
    }
  }

  /// /////
  /// USERS

  const allUsers = [
    ...Object.entries(users),
    ...Object.values(facilities).map(({ user, password }) => [user, { password }]),
  ];

  for (const [id, { role = 'admin', password }] of allUsers) {
    let realPassword = password;
    if (!realPassword) {
      realPassword = getRandomBase64String(16);
      // eslint-disable-next-line no-console
      console.log(`NEW PASSWORD for ${id}: ${realPassword}`);
    }

    const user = await store.models.User.findByPk(id);
    if (user) {
      log.info('Updating user', { id });
      user.set({ role });
      user.setPassword(realPassword);
      await user.save();
    } else {
      log.info('Creating user', { id });
      await store.models.User.create({
        id,
        role,
        password: realPassword,
      });
    }
  }

  log.info('Creating system user');
  await store.models.User.create({
    id: UUID_NIL,
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
