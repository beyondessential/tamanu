import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import { startScheduledTasks, startFhirWorkerTasks } from '../tasks';
import pkg from '../../package.json';

export const tasks = async ({ skipMigrationCheck }) => {
  log.info(`Starting sync tasks runner version ${pkg.version}.`);

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
  .action(tasks);
