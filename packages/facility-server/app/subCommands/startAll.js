import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { listenForBindAddresses } from '@tamanu/shared/utils/bindAddress';
import { DEVICE_TYPES, JOB_TOPICS } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { FacilitySyncConnection } from '../sync';
import { getServerFacilityIds } from '../serverConfig';
import { setupSyncRuntime, startSyncRuntimeWhenConfigured } from '../setupSyncRuntime';
import { createApiApp } from '../createApiApp';
import { startScheduledTasks } from '../tasks';
import { startFhirWorker } from './startFhirWorker';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { SyncTask } from '../tasks/SyncTask';

async function startApiSyncAndTasks(context) {
  await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });
  await checkConfig(context);
  await performDatabaseIntegrityChecks(context);

  // eslint-disable-next-line require-atomic-updates -- single-threaded boot, no concurrent writers
  context.syncConnection = new FacilitySyncConnection();
  const isConfigured = await setupSyncRuntime(context);

  const { express, server } = await createApiApp(context);

  listenForBindAddresses({ server, app: express, fallbackPort: config.port, label: 'API Server' });

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
    context.close();
  });

  await context.waitForClose();
}

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

  const fhirWorkers =
    process.env.NODE_ENV !== 'production'
      ? [
          startFhirWorker({
            name: 'refresh',
            skipMigrationCheck,
            topics: [
              JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM,
              JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE,
              JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
            ].join(','),
          }),
          startFhirWorker({
            name: 'resolver',
            skipMigrationCheck,
            topics: JOB_TOPICS.FHIR.RESOLVER,
          }),
        ]
      : [];

  return Promise.race([startApiSyncAndTasks(context), ...fhirWorkers]);
}

export const startAllCommand = new Command('startAll')
  .description('Start both the Tamanu Facility API server, sync server, and tasks runner')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startAll);
