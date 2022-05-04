import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { createApp } from '../createApp';
import { startScheduledTasks } from '../tasks';
import { ApplicationContext } from '../ApplicationContext';
import { version } from '../serverInfo';
import { setupEnv } from '../env';

const { port } = config;

const serve = async ({ skipMigrationCheck }) => {
  log.info(`Starting sync server version ${version}.`);

  log.info(`Process info`, {
    execArgs: process.execArgs || "<empty>",
  });

  const context = await new ApplicationContext().init();
  const { store } = context;

  if (config.db.migrateOnStartup) {
    await store.sequelize.migrate('up');
  } else {
    await store.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  setupEnv();

  const app = createApp(context);

  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
  });

  // only execute tasks on the first worker process
  // NODE_APP_INSTANCE is set by PM2; if it's not present, assume this process is the first
  const isFirstProcess = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
  if (isFirstProcess) {
    const stopScheduledTasks = await startScheduledTasks(context);
    process.on('SIGTERM', () => {
      log.info('Received SIGTERM, stopping scheduled tasks');
      stopScheduledTasks();
    });
  }
};

export const serveCommand = new Command('serve')
  .description('Start the Tamanu sync-server')
  .option('--skipMigrationCheck', 'skip the migration check on startup')
  .action(serve);
