import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { getServerFacilityIds } from '../serverConfig';
import { setupSyncRuntime } from '../setupSyncRuntime';
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

  await setupSyncRuntime(context, { syncManager });

  const cancelTasks = startScheduledTasks(context, taskClasses);
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, stopping scheduled tasks');
    cancelTasks();
  });
}

export const startTasksCommand = new Command('startTasks')
  .description('Start the Tamanu Facility tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startTasks);
