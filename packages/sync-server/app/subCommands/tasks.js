import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import { startScheduledTasks, startFhirWorkerTasks } from '../tasks';
import { provision } from './provision';
import pkg from '../../package.json';

export const tasks = async ({ skipMigrationCheck, provisioning }) => {
  if (provisioning) {
    await provision({ file: provisioning, skipIfNotNeeded: true });
  }

  log.info(`Starting sync tasks runner version ${pkg.version}`);

  const context = await new ApplicationContext().init();
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  const stopScheduledTasks = await startScheduledTasks(context);
  const worker = await startFhirWorkerTasks(context);

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      log.info(`Received ${sig}, stopping scheduled tasks`);
      stopScheduledTasks();
      await worker.stop();
      context.close();
    });
  }

  await context.waitForClose();
};

export const tasksCommand = new Command('tasks')
  .description('Start the Tamanu sync tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--provisioning <file>',
    'if provided and no users exist, provision Tamanu from this file',
  )
  .action(tasks);
