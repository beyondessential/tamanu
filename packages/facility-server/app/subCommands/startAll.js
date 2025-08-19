import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { initTimesync } from '../services/initTimesync';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager, FacilitySyncConnection } from '../sync';
import { createApiApp } from '../createApiApp';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { SyncTask } from '../tasks/SyncTask';

async function startAll({ skipMigrationCheck }) {
  log.info(`Starting facility server version ${version}`, {
    serverFacilityIds: selectFacilityIds(config),
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'api' });

  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up');
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  context.centralServer = new CentralServerConnection(context);
  context.syncManager = new FacilitySyncManager(context);
  context.syncConnection = new FacilitySyncConnection();
  context.timesync = await initTimesync({
    models: context.models,
    url: `${config.sync.host.trim().replace(/\/*$/, '')}/api/timesync`,
  });

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    config,
  });

  const { server } = await createApiApp(context);

  let { port } = config;
  if (+process.env.PORT) {
    port = +process.env.PORT;
  }
  server.listen(port, () => {
    log.info(`API Server is running on port ${port}!`);
  });

  const { server: syncServer } = await createSyncApp(context);

  let { port: syncPort } = config.sync.syncApiConnection;
  syncServer.listen(syncPort, () => {
    log.info(`SYNC server is running on port ${syncPort}!`);
  });

  const syncTaskClass = [SyncTask];
  const cancelTasks = startScheduledTasks(context);
  const cancelSyncTask = startScheduledTasks(context, syncTaskClass);

  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    cancelTasks();
    cancelSyncTask();
    server.close();
    syncServer.close();
  });
}

export const startAllCommand = new Command('startAll')
  .description('Start both the Tamanu Facility API server, sync server, and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startAll);
