import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { initTimesync } from '../services/initTimesync';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { FacilitySyncConnection } from '../sync';
import { getSyncConfig, getServerFacilityIds, isServerConfigured } from '../serverConfig';
import { setupSyncRuntime, SYNC_NOT_CONFIGURED_WARNING } from '../setupSyncRuntime';

import { createApiApp } from '../createApiApp';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { startTasks } from './startTasks';
import { SyncTask } from '../tasks/SyncTask';

const APP_TYPES = {
  API: 'api',
  SYNC: 'sync',
};

const startApp =
  appType =>
  async ({ skipMigrationCheck }) => {
    log.info(`Starting facility ${appType} server version ${version}`, {
      serverFacilityIds: getServerFacilityIds(),
    });

    log.info(`Process info`, {
      execArgs: process.execArgs || '<empty>',
    });

    const context = await new ApplicationContext().init({ appType });

    await prepareDatabaseForStartup(context, { skipMigrationCheck });
    await context.initReportingStores();

    await initDeviceId({ context, deviceType: DEVICE_TYPES.FACILITY_SERVER });
    await checkConfig(context);
    await performDatabaseIntegrityChecks(context);

    if (appType === APP_TYPES.API) {
      // The API server doesn't open a central connection; it just needs timesync.
      context.syncConnection = new FacilitySyncConnection();
      if (isServerConfigured()) {
        context.timesync = await initTimesync({
          models: context.models,
          url: `${getSyncConfig().host.replace(/\/*$/, '')}/api/timesync`,
        });
        await performTimeZoneChecks({
          remote: context.centralServer,
          sequelize: context.sequelize,
          config,
        });
      } else {
        log.warn(SYNC_NOT_CONFIGURED_WARNING);
      }
    } else {
      await setupSyncRuntime(context);
    }

    let server, port;
    switch (appType) {
      case APP_TYPES.API:
        ({ server } = await createApiApp(context));
        ({ port } = config);
        break;
      case APP_TYPES.SYNC:
        ({ server } = await createSyncApp(context));
        ({ port } = config.sync.syncApiConnection);

        // start SyncTask as part of sync app so that it is in the same process with tamanu-sync process
        startTasks({
          skipMigrationCheck: false,
          taskClasses: [SyncTask],
          syncManager: context.syncManager, // passing syncManager because it must be shared with SyncTask to prevent multiple syncs
        });
        break;
      default:
        throw new Error(`Unknown app type: ${appType}`);
    }

    if (+process.env.PORT) {
      port = +process.env.PORT;
    }
    server.listen(port, () => {
      log.info(`Server is running on port ${port}!`);
    });
    process.once('SIGTERM', () => {
      log.info('Received SIGTERM, closing HTTP server');
      server.close();
    });
  };

export const startApiCommand = new Command('startApi')
  .description('Start the Tamanu Facility API server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startApp(APP_TYPES.API));

export const startSyncCommand = new Command('startSync')
  .description('Start the Tamanu Facility SYNC server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startApp(APP_TYPES.SYNC));
