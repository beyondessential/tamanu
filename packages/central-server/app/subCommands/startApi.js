import config from 'config';
import { Command } from 'commander';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';

import { createApp } from '../createApp';
import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';

export const startApi = async ({ skipMigrationCheck }) => {
  log.info(`Starting central server version ${version}`);

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init({ appType: 'api' });
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const { server } = await createApp(context);

  await performTimeZoneChecks({
    sequelize: store.sequelize,
    config,
  });

  const minConnectionPoolSnapshotHeadroom = 4;
  const connectionPoolSnapshotHeadroom =
    config.db?.pool?.max - config?.sync?.numberConcurrentPullSnapshots;
  if (connectionPoolSnapshotHeadroom < minConnectionPoolSnapshotHeadroom) {
    log.warn(
      `WARNING: config.db.pool.max is dangerously close to config.sync.numberConcurrentPullSnapshots (within ${minConnectionPoolSnapshotHeadroom} connections)`,
      {
        'config.db.pool.max': config.db?.pool?.max,
        'config.sync.numberConcurrentPullSnapshots': config.sync?.numberConcurrentPullSnapshots,
        connectionPoolSnapshotHeadroom,
      },
    );
  }

  let { port } = config;
  if (+process.env.PORT) {
    port = +process.env.PORT;
  }
  server.listen(port, () => {
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

export const startApiCommand = new Command('startApi')
  .alias('serve') // deprecated
  .description('Start the Tamanu Central API server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(startApi);
