import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import { startScheduledTasks } from '../tasks';
import { version } from '../../package.json';

export const tasks = async ({ skipMigrationCheck }) => {
  log.info(`Starting sync tasks runner version ${version}.`);

  const context = await new ApplicationContext().init();
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const stopScheduledTasks = await startScheduledTasks(context);
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      log.info(`Received ${sig}, stopping scheduled tasks`);
      stopScheduledTasks();
    });
  }
};

export const tasksCommand = new Command('tasks')
  .description('Start the Tamanu sync tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(tasks);
