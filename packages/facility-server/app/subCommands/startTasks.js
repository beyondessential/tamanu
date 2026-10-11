import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { defineDbNotifier } from '@tamanu/shared/services/dbNotifier';
import { registerSettingsCacheInvalidator } from '@tamanu/settings/cache';
import { DEVICE_TYPES, NOTIFY_CHANNELS } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { getServerFacilityIds } from '../serverConfig';
import { setupSyncRuntime, startSyncRuntimeWhenConfigured } from '../setupSyncRuntime';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

export async function startTasks({ skipMigrationCheck, taskClasses, syncManager }) {
  log.info(`Starting facility task runner version ${version}`, {
    serverFacilityIds: getServerFacilityIds(),
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'tasks' });

  await prepareDatabaseForStartup(context, { skipMigrationCheck });
  await context.initReportingStores();

  await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  // Keep the task runner's process-local settings cache in sync via NOTIFYs.
  const dbNotifier = await defineDbNotifier(context.sequelize.config, [
    NOTIFY_CHANNELS.TABLE_CHANGED,
  ]);
  registerSettingsCacheInvalidator(dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED]);

  const isConfigured = await setupSyncRuntime(context, { syncManager });

  const cancelTasks = await startScheduledTasks(context, taskClasses);
  // If booted unconfigured, start syncing once first-run setup completes.
  const cancelConfigPoll = isConfigured ? () => {} : startSyncRuntimeWhenConfigured(context);
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, stopping scheduled tasks');
    cancelTasks();
    cancelConfigPoll();
    dbNotifier.close();
  });
}

export const startTasksCommand = new Command('startTasks')
  .description('Start the Tamanu Facility tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startTasks);
