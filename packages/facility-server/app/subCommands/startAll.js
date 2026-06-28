import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { FacilitySyncConnection } from '../sync';
import { getServerFacilityIds } from '../serverConfig';
import { setupSyncRuntime, startSyncRuntimeWhenConfigured } from '../setupSyncRuntime';
import { createApiApp } from '../createApiApp';
import { startScheduledTasks } from '../tasks';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { SyncTask } from '../tasks/SyncTask';

async function startAll({ skipMigrationCheck }) {
  log.info(`Starting facility server version ${version}`, {
    serverFacilityIds: getServerFacilityIds(),
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'api' });

  await prepareDatabaseForStartup(context, { skipMigrationCheck });
  await context.initReportingStores();

  await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  context.syncConnection = new FacilitySyncConnection();
  const isConfigured = await setupSyncRuntime(context);

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

  const cancelTasks = startScheduledTasks(context);
  // SyncTask no-ops until the runtime is ready, so schedule it regardless.
  const cancelSyncTask = startScheduledTasks(context, [SyncTask]);
  const cancelConfigPoll = isConfigured ? () => {} : startSyncRuntimeWhenConfigured(context);

  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    cancelTasks();
    cancelSyncTask();
    cancelConfigPoll();
    server.close();
    syncServer.close();
  });
}

export const startAllCommand = new Command('startAll')
  .description('Start both the Tamanu Facility API server, sync server, and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startAll);
