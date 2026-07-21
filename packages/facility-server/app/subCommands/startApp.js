import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { listenForBindAddresses } from '@tamanu/shared/utils/bindAddress';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { DEVICE_TYPES } from '@tamanu/constants';

import { checkConfig } from '../checkConfig';
import { initDeviceId } from '@tamanu/shared/utils';
import { initTimesync } from '../services/initTimesync';
import { performDatabaseIntegrityChecks, prepareDatabaseForStartup } from '../database';
import { FacilitySyncConnection } from '../sync';
import { getSyncConfig, getServerFacilityIds, isServerConfigured } from '../serverConfig';
import {
  setupSyncRuntime,
  startSyncRuntimeWhenConfigured,
  SYNC_NOT_CONFIGURED_WARNING,
} from '../setupSyncRuntime';

import { createApiApp } from '../createApiApp';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';
import { createSyncApp } from '../createSyncApp';
import { startScheduledTasks } from '../tasks';
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

    let cancelConfigPoll = () => {};
    if (appType === APP_TYPES.API) {
      // The API server doesn't open a central connection; it just needs timesync.
      // eslint-disable-next-line require-atomic-updates -- single-threaded boot, no concurrent writers
      context.syncConnection = new FacilitySyncConnection();
      const setupApiRuntime = async ctx => {
        /* eslint-disable-next-line require-atomic-updates -- no concurrent writers */
        ctx.timesync = await initTimesync({
          models: ctx.models,
          url: `${getSyncConfig().host.replace(/\/*$/, '')}/api/timesync`,
        });
        // No central connection on the API server, so no remote timezone to check.
        await performTimeZoneChecks({
          sequelize: ctx.sequelize,
          config,
        });
      };
      if (isServerConfigured()) {
        await setupApiRuntime(context);
      } else {
        log.warn(SYNC_NOT_CONFIGURED_WARNING);
        // Another process (or replica) may serve the wizard POST; pick up the new
        // config here too so this process starts reporting configured, serving
        // logins and timesync without a restart.
        cancelConfigPoll = startSyncRuntimeWhenConfigured(context, { setup: setupApiRuntime });
      }
    } else {
      await setupSyncRuntime(context);
    }

    let server, express, port;
    let cancelSyncTask = () => {};
    switch (appType) {
      case APP_TYPES.API:
        ({ express, server } = await createApiApp(context));
        ({ port } = config);
        break;
      case APP_TYPES.SYNC: {
        ({ express, server } = await createSyncApp(context));
        ({ port } = config.sync.syncApiConnection);

        // Register SyncTask synchronously on this process's context (matching
        // startAll): starting it via startTasks' full boot chain left an
        // unawaited promise that could stall silently (e.g. central unreachable
        // during a restart) and leave the facility without scheduled sync while
        // manual sync kept working. SyncTask no-ops until syncManager is wired,
        // so scheduling it before first-run setup completes is safe.
        cancelSyncTask = startScheduledTasks(context, [SyncTask]);
        if (!context.syncManager) {
          // Booted unconfigured: poll for first-run setup, then wire the runtime.
          cancelConfigPoll = startSyncRuntimeWhenConfigured(context);
        }
        break;
      }
      default:
        throw new Error(`Unknown app type: ${appType}`);
    }

    listenForBindAddresses({ server, app: express, fallbackPort: port });
    process.once('SIGTERM', () => {
      log.info('Received SIGTERM, closing HTTP server');
      cancelSyncTask();
      cancelConfigPoll();
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
