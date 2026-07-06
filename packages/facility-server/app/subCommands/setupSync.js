import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import { ApplicationContext } from '../ApplicationContext';
import { getServerFacilityIds, getSyncConfig } from '../serverConfig';

// Writes the given sync host/credentials/facilities to local system facts. The
// password goes through LocalSystemSecret (encrypted). Idempotent: skips when the
// facts already exist (the email fact only exists after a completed setup) unless
// force is set. Returns whether it wrote.
export const writeSyncConfig = async (context, { host, email, password, facilityIds, force } = {}) => {
  const { LocalSystemFact, LocalSystemSecret } = context.models;

  if ((await LocalSystemFact.get(FACT_SYNC_EMAIL)) && !force) {
    log.info('Sync facts already present; nothing to do (pass --force to overwrite).');
    return false;
  }

  if (!host || !email || !password || !facilityIds?.length) {
    throw new Error('setupSync needs SYNC_URL (with credentials) and SYNC_FACILITY_IDS to be set.');
  }

  await context.sequelize.transaction(async () => {
    await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
    await LocalSystemFact.set(FACT_SYNC_EMAIL, email);
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(facilityIds));
    await LocalSystemSecret.set(FACT_SYNC_PASSWORD, password);
  });

  log.info('Sync configuration written to local system facts', { host, facilityIds });
  return true;
};

// Resolves the sync config (from SYNC_URL + SYNC_FACILITY_IDS) and persists it, so
// an automated deploy can configure the server without the setup wizard — the
// deploy already knows the details. Must run in-process (not raw SQL) for the
// encrypted password.
export const setupSync = async ({ force } = {}) => {
  const context = await new ApplicationContext().init();
  try {
    const { host, email, password } = getSyncConfig();
    const facilityIds = getServerFacilityIds();
    await writeSyncConfig(context, { host, email, password, facilityIds, force });
  } finally {
    await context.close();
  }
};

export const setupSyncCommand = new Command('setupSync')
  .description(
    'Write sync host/credentials/facilities to local system facts (for automated deploys)',
  )
  .option('--force', 'overwrite an existing configuration')
  .action(setupSync);
