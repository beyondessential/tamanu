import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { ApplicationContext } from '../ApplicationContext';
import { startScheduledTasks } from '../tasks';
import { provision } from './provision';
import pkg from '../../package.json';

export const startTasks = async ({ skipMigrationCheck, provisioning }) => {
  // doesn't really make sense to have this, but required for current ECS stack
  if (provisioning) {
    await provision(provisioning, { skipIfNotNeeded: true });
  }

  log.info(`Starting Central tasks runner version ${pkg.version}`);

  const context = await new ApplicationContext().init({ appType: 'tasks' });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });

  const stopScheduledTasks = await startScheduledTasks(context);

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      log.info(`Received ${sig}, stopping scheduled tasks`);
      stopScheduledTasks();
      context.close();
    });
  }

  await context.waitForClose();
};

export const startTasksCommand = new Command('startTasks')
  .alias('tasks') // deprecated
  .description('Start the Tamanu Central tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--provisioning <file>',
    'if provided and no users exist, provision Tamanu from this file',
  )
  .action(startTasks);
