import { Command } from 'commander';

import { runStartFhirWorker } from '@tamanu/shared/tasks';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../ApplicationContext';
import pkg from '../../package.json';

const defaults = {
  appType: CENTRAL_SERVER_APP_TYPES.FHIR_WORKER,
  serverName: 'Central',
  version: pkg.version,
};

export async function startFhirWorker(opts = {}) {
  const {
    skipMigrationCheck,
    topics,
    name,
    appType = defaults.appType,
    serverName = defaults.serverName,
    version = defaults.version,
  } = { ...defaults, ...opts };

  const dbKey = name ? `${appType}(${name})` : appType;
  const context = await new ApplicationContext().init({ appType, dbKey });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  return runStartFhirWorker({
    context,
    settings: context.settings,
    serverName,
    version,
    topics,
  });
}

export const startFhirWorkerCommand = new Command('startFhirWorker')
  .description('Start the Tamanu Central FHIR worker')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option('--topics <topics>', 'comma-separated topics to work on, defaults to all')
  .action(startFhirWorker);
