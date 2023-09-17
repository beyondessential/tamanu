import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { performTimeZoneChecks } from 'shared/utils/timeZoneCheck';
import { ReadSettings } from '@tamanu/settings';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { initDatabase, performDatabaseIntegrityChecks } from '../database';
import { FacilitySyncManager, CentralServerConnection } from '../sync';
import { createApp } from '../createApp';
import { startScheduledTasks } from '../tasks';
import { listenForServerQueries } from '../discovery';

import { version } from '../serverInfo';

async function serve({ skipMigrationCheck }) {
  log.info(`Starting facility server version ${version}`, {
    serverFacilityId: config.serverFacilityId,
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await initDatabase();
  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up');
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  const settings = new ReadSettings(context.models, config.serverFacilityId);
  const syncConfig = await settings.get('sync');
  context.settings = settings;

  await initDeviceId(context);
  await checkConfig(config, context);
  await performDatabaseIntegrityChecks(context);
  context.centralServer = new CentralServerConnection(context, syncConfig);
  context.centralServer.connect(); // preemptively connect central server to speed up sync
  context.syncManager = new FacilitySyncManager(context);
  context.config = await settings.get();

  const countryTimeZone = await settings.get('countryTimeZone');
  const discoverySettings = await settings.get('discovery');

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

  startScheduledTasks(context);
}

export const serveCommand = new Command('serve')
  .description('Start the Tamanu lan server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(serve);
