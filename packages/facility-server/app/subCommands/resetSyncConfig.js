import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';

import { ApplicationContext } from '../ApplicationContext';

const SYNC_CONFIG_FACTS = [FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_FACILITY_IDS];

// Clears the sync facts so the server is unconfigured and can be set up again.
// Host-level access only; restart the server afterwards to take effect.
export const resetSyncConfig = async () => {
  const context = await new ApplicationContext().init();
  const { LocalSystemFact, LocalSystemSecret } = context.models;

  // Hard delete: a soft-deleted row still occupies the unique `key` constraint,
  // so a later set() of the same key would collide.
  await LocalSystemFact.destroy({ where: { key: SYNC_CONFIG_FACTS }, force: true });
  await LocalSystemSecret.destroy({ where: { key: FACT_SYNC_PASSWORD }, force: true });

  log.info('Sync configuration cleared; server is now unconfigured. Restart to re-run setup.');
  await context.close();
};

export const resetSyncConfigCommand = new Command('resetSyncConfig')
  .description('Clear the sync host, credentials and facilities so the server can be set up again')
  .action(resetSyncConfig);
