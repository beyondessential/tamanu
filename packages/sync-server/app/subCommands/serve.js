import config from 'config';
import { Command } from 'commander';

import { log, setupTracing } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';

import { provision } from './provision';
import { createApp } from '../createApp';
import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';

const { port } = config;

export const serve = async ({ skipMigrationCheck, provisioning }) => {
  if (provisioning) {
    await provision({ file: provisioning, skipIfNotNeeded: true });
  }

  log.info(`Starting sync server version ${version}`);

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init();
  const { store, settings } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const app = createApp(context);

  const countryTimeZone = await settings.get('countryTimeZone');
  const numberConcurrentPullSnapshots = await settings.get('sync.numberConcurrentPullSnapshots');

  await setupTracing(context);

  await performTimeZoneChecks({
    sequelize: store.sequelize,
    countryTimeZone,
  });

  const minConnectionPoolSnapshotHeadroom = 4;
  const connectionPoolSnapshotHeadroom = config.db?.pool?.max - numberConcurrentPullSnapshots;
  if (connectionPoolSnapshotHeadroom < minConnectionPoolSnapshotHeadroom) {
    log.warn(
      `WARNING: config.db.pool.max is dangerously close to config.sync.numberConcurrentPullSnapshots (within ${minConnectionPoolSnapshotHeadroom} connections)`,
      {
        'config.db.pool.max': config.db?.pool?.max,
        'config.sync.numberConcurrentPullSnapshots': numberConcurrentPullSnapshots,
        connectionPoolSnapshotHeadroom,
      },
    );
  }

  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  context.onClose(() => server.close());

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, () => {
      log.info(`Received ${sig}, closing HTTP server`);
      context.close();
    });
  }

  await context.waitForClose();
};

export const serveCommand = new Command('serve')
  .description('Start the Tamanu sync server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .option(
    '--provisioning <file>',
    'if provided and no users exist, provision Tamanu from this file',
  )
  .action(serve);
