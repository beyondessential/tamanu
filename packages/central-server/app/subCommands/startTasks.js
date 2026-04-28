import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { registerSettingsCacheInvalidator } from '@tamanu/settings/cache';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

import { ApplicationContext, CENTRAL_SERVER_APP_TYPES } from '../ApplicationContext';
import { startScheduledTasks } from '../tasks';
import { CentralSyncManager } from '../sync/CentralSyncManager';
import pkg from '../../package.json';

export const startTasks = async ({ skipMigrationCheck }) => {
  log.info(`Starting Central tasks runner version ${pkg.version}`);

  const context = await new ApplicationContext().init({ appType: CENTRAL_SERVER_APP_TYPES.TASKS });
  await context.store.sequelize.assertUpToDate({ skipMigrationCheck });
  context.centralSyncManager = new CentralSyncManager(context);

  // Keep the task runner's process-local settings cache in sync via NOTIFYs.
  const dbNotifier = await defineDbNotifier(context.store.sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
  ]);
  registerSettingsCacheInvalidator(dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]);
  context.onClose(() => dbNotifier.close());

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
  .action(startTasks);
