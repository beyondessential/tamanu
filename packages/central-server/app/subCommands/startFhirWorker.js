import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../ApplicationContext';
import { startFhirWorkerTasks } from '../tasks';
import pkg from '../../package.json';

export const startFhirWorker = async ({ name, skipMigrationCheck, topics }) => {
  log.info(`Starting Central FHIR worker version ${pkg.version}`);

  const appType = CENTRAL_SERVER_APP_TYPES.FHIR_WORKER;
  const dbKey = name ? `${appType}(${name})` : appType;
  const context = await new ApplicationContext().init({ appType, dbKey });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  if (!topics || topics === 'all') {
    topics = null;
  } else {
    topics = topics.split(/,+\s*/).filter(Boolean);
    log.info(`FHIR worker restricted to topics: ${topics.join(', ')}`);
  }

  const worker = await startFhirWorkerTasks({ store: context.store, topics });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      log.info(`Received ${sig}, stopping fhir worker`);
      await worker.stop();
      context.close();
    });
  }

  await context.waitForClose();
};

export const startFhirWorkerCommand = new Command('startFhirWorker')
  .description('Start the Tamanu Central FHIR worker')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option('--topics <topics>', 'comma-separated topics to work on, defaults to all')
  .action(startFhirWorker);
