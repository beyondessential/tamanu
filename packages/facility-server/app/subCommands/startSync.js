import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';

import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';
import { checkConfig } from '../checkConfig';
import { initDeviceId } from '../sync/initDeviceId';
import { performDatabaseIntegrityChecks } from '../database';
import { CentralServerConnection, FacilitySyncManager } from '../sync';
import { createApp } from '../createSyncApp';

import { version } from '../serverInfo';
import { ApplicationContext } from '../ApplicationContext';

async function startSync({ skipMigrationCheck }) {
  log.info(`Starting facility SYNC server version ${version}`, {
    serverFacilityId: config.serverFacilityId,
  });

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'sync' });

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

  const { server } = await createApp(context);

  const { port } = config.sync;
  server.listen(port, () => {
    log.info(`Sync server is running on port ${port}!`);
  });
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
  });
}

export const startSyncCommand = new Command('startApi')
  .description('Start the Tamanu Facility SYNC server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startSync);
