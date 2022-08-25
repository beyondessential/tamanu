import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';
import { checkIntegrationsConfig } from '../integrations';

async function setup({ facility }) {
  const store = await initDatabase({ testMode: false });
  const userCount = await store.models.User.count();
  if (userCount > 0) {
    throw new Error(`Found ${userCount} users already in the database, aborting setup.`);
  }

  checkIntegrationsConfig();

  // create initial admin user
  const { initialUser } = config.auth;
  if (!initialUser.email) {
    throw new Error(`The initial user in config is missing an email address.`);
  }

  log.info(`Creating initial user account for ${initialUser.email}...`);
  await store.models.User.create(initialUser);

  if (facility) {
    log.info(`Creating initial facility ${facility}...`);
    await store.models.Facility.create({
      id: facility,
      code: facility,
      name: facility,
    });
  }

  log.info(`Done.`);
  process.exit(0);
}

export const setupCommand = new Command('setup')
  .description('Set up initial data within the Tamanu app')
  .option('--facility <id>', 'also create a facility')
  .action(setup);
