import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { createApp } from '../createApp';
import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';

const { port } = config;

export const serve = async ({ skipMigrationCheck }) => {
  log.info(`Starting sync server version ${version}.`);

  log.info(`Process info`, {
    execArgs: process.execArgs || '<empty>',
  });

  const context = await new ApplicationContext().init();
  const { store } = context;

  await store.sequelize.assertUpToDate({ skipMigrationCheck });

  const app = createApp(context);

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
  .action(serve);
