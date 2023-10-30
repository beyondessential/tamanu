import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { ReadSettings } from '@tamanu/settings';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { performDatabaseIntegrityChecks } from '../database';
import { FacilitySyncManager, CentralServerConnection } from '../sync';
import { createApp } from '../createApp';
import { startScheduledTasks } from '../tasks';
import { listenForServerQueries } from '../discovery';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

async function serve({ skipMigrationCheck }) {
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

  const settings = new ReadSettings(context.models, config.serverFacilityId);
  context.settings = settings;

  const syncConfig = await settings.get('sync');
  const countryTimeZone = await settings.get('countryTimeZone');
  const discoverySettings = await settings.get('discovery');

  await initDeviceId(context);
  await checkConfig(config, context);
  await performDatabaseIntegrityChecks(context);


  context.centralServer = new CentralServerConnection(context, syncConfig);

  context.syncManager = new FacilitySyncManager(context);

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    countryTimeZone,
  });

  const app = createApp(context);

  const { port } = config;
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
  });

  listenForServerQueries(discoverySettings);

  const syncSchedule = await settings.get('sync.schedule');
  const schedules = await settings.get('schedules');

  startScheduledTasks({
    ...context,
    schedules: {
      ...schedules,
      sync: {
        schedule: syncSchedule,
      },
    },
  });
}

export const serveCommand = new Command('serve')
  .description('Start the Tamanu lan server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(serve);
