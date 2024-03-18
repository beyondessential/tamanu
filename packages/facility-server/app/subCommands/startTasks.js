import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

async function startTasks({ skipMigrationCheck }) {
  log.info(`Starting facility task runner version ${version}`, {
    serverFacilityId: config.serverFacilityId,
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init();

  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up');
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  await initDeviceId(context);
  await checkConfig(config, context);
  await performDatabaseIntegrityChecks(context);

  context.centralServer = new CentralServerConnection(context);
  context.syncManager = new FacilitySyncManager(context);

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    config,
  });

  const cancelTasks = startScheduledTasks(context);
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, stopping scheduled tasks');
    cancelTasks();
  });
}

export const startTasksCommand = new Command('startTasks')
  .description('Start the Tamanu Facility tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startTasks);
