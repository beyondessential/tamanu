import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager, FacilitySyncConnection } from '../sync';
import { createApiApp } from '../createApiApp';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { ReadSettings } from '@tamanu/settings/reader';

async function startAll({ skipMigrationCheck }) {
  log.info(`Starting facility server version ${version}`, {
    serverFacilityId: config.serverFacilityId,
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'api' });

  context.settings = new ReadSettings(context.models, config.serverFacilityId);

  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up');
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  await initDeviceId(context);
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  context.centralServer = new CentralServerConnection(context);
  context.syncManager = new FacilitySyncManager(context);
  context.syncConnection = new FacilitySyncConnection();

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    config,
  });

  const { server } = await createApiApp(context);

  const { port } = config;
  server.listen(port, () => {
    log.info(`API Server is running on port ${port}!`);
  });

  const { server: syncServer } = await createSyncApp(context);

  const { port: syncPort } = config.sync.syncApiConnection;
  syncServer.listen(syncPort, () => {
    log.info(`SYNC server is running on port ${syncPort}!`);
  });

  const cancelTasks = startScheduledTasks(context);

  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    cancelTasks();
    server.close();
    syncServer.close();
  });
}

export const startAllCommand = new Command('startAll')
  .description('Start both the Tamanu Facility API server and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startAll);
