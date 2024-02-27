import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import { startFhirWorkerTasks } from '../tasks';
import pkg from '../../package.json';

export const startFhirWorker = async ({ skipMigrationCheck }) => {
  log.info(`Starting Central FHIR worker version ${pkg.version}`);

  const context = await new ApplicationContext().init();
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  const worker = await startFhirWorkerTasks(context);

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
  .action(startFhirWorker);
