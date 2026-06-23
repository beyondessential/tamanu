import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import { ApplicationContext } from '../ApplicationContext';

const SYNC_CONFIG_FACTS = [
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
];

// Clears the sync host/credentials/facilities so the server returns to the
// unconfigured state and can be set up again (via the wizard, SYNC_URL env, or
// a re-run). Host-level access only — reconfiguring a live server isn't exposed
// over the network. Restart the server afterwards for it to take effect.
export const resetSyncConfig = async () => {
  const context = await new ApplicationContext().init();
  const { LocalSystemFact } = context.models;

  for (const key of SYNC_CONFIG_FACTS) {
    await LocalSystemFact.delete(key);
  }

  log.info('Sync configuration cleared; server is now unconfigured. Restart to re-run setup.');
  await context.close();
};

export const resetSyncConfigCommand = new Command('resetSyncConfig')
  .description('Clear the sync host, credentials and facilities so the server can be set up again')
  .action(resetSyncConfig);
