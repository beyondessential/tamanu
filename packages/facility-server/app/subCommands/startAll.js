import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { createApp } from '../createApp';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

async function startAll({ skipMigrationCheck }) {
  log.info(`Starting facility server version ${version}`, {
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

  const app = createApp(context);

  const { port } = config;
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  const cancelTasks = startScheduledTasks(context);

  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    cancelTasks();
    server.close();
  });
}

export const startAllCommand = new Command('startAll')
  .description('Start both the Tamanu Facility API server and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startAll);
