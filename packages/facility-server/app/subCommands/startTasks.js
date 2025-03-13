import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { initTimesync } from '../services/initTimesync';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

export async function startTasks({ skipMigrationCheck, taskClasses, syncManager }) {
  log.info(`Starting facility task runner version ${version}`, {
    serverFacilityIds: selectFacilityIds(config),
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'tasks' });

  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up');
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  await initDeviceId(context);
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  context.timesync = await initTimesync({
    models: context.models,
    url: `${config.sync.host.trim().replace(/\/*$/, '')}/api/timesync`,
    settings: context.settings.global,
    readOnly: false,
  });

  context.centralServer = new CentralServerConnection(context);
  context.syncManager = syncManager ?? new FacilitySyncManager(context);

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    config,
  });

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
