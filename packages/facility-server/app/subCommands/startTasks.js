import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { initTimesync } from '../services/initTimesync';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { getSyncConfig, getServerFacilityIds, isServerConfigured } from '../serverConfig';
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

  if (isServerConfigured()) {
    context.timesync = await initTimesync({
      models: context.models,
      url: `${getSyncConfig().host.replace(/\/*$/, '')}/api/timesync`,
    });

    context.centralServer = new CentralServerConnection(context);
    context.syncManager = syncManager ?? new FacilitySyncManager(context);

    await performTimeZoneChecks({
      remote: context.centralServer,
      sequelize: context.sequelize,
      config,
    });
  } else {
    log.warn(
      'Facility server has no sync host/facilities configured; sync is disabled until setup ' +
        'is completed (SYNC_URL / SYNC_FACILITY_IDS env or the setup wizard).',
    );
  }

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
