import config from 'config';
import { log } from 'shared/services/logging';

import { initDatabase } from '../database';
import { vdsConfig } from '../integrations/VdsNc';

export async function setup() {
  const store = await initDatabase({ testMode: false });
  const userCount = await store.models.User.count();
  if (userCount > 0) {
    throw new Error(`Found ${userCount} users already in the database, aborting setup.`);
  }

  // Check VDS config (if enabled)
  vdsConfig();

  // create initial admin user
  const { initialUser } = config.auth;
  if (!initialUser.email) {
    throw new Error(`The initial user in config is missing an email address.`);
  }

  log.info(`Creating initial user account for ${initialUser.email}...`);
  await store.models.User.create(initialUser);
  log.info(`Done.`);
  process.exit(0);
}
