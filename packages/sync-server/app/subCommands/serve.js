import config from 'config';
import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { createApp } from '../app/createApp';
import { startScheduledTasks } from '../app/tasks';
import { ApplicationContext } from '../app/ApplicationContext';
import { version } from '../package.json';
import { setupEnv } from '../app/env';

const { port } = config;

function getRoutes(router, prefix = '') {
  const getRouteName = ({ regexp }) =>
    regexp
      .toString()
      .replace(/\\\//g, '/')
      .replace(/^\/\^(.*)\/i$/, '$1')
      .replace('/?(?=/|$)', '');
  let routes = [];
  router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push(`${prefix}${middleware.route.path.replace(/(\$|\/)$/, '')}`);
    } else if (middleware.name === 'router') {
      routes = [...routes, ...getRoutes(middleware.handle, `${prefix}${getRouteName(middleware)}`)];
    }
  });
  return routes;
}

export const serve = async ({ skipMigrationCheck }) => {
  const context = await new ApplicationContext().init();
  const { store } = context;
  log.info(`Starting sync server version ${version}.`);

  if (config.db.migrateOnStartup) {
    await store.sequelize.migrate({ up: true });
  } else {
    await store.sequelize.assertUpToDate({ skipMigrationCheck });
  }

  setupEnv();

  const app = createApp(context);

  if (process.env.PRINT_ROUTES === 'true') {
    // console instead of log.info is fine here because the aim is to output the
    // routes without wrapping, supressing, or transporting the output
    // eslint-disable-next-line no-console
    console.log(getRoutes(app._router).join('\n'));
  }

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
}

// addServeOptions is used for the default action with no subcommand
export const addServeOptions = cmd =>
  cmd.option('--skipMigrationCheck', 'skip the migration check on startup', false);

export const serveCommand = new Command('serve')
  .description('Start the Tamanu sync-server')
  .action(serve);
addServeOptions(serveCommand);
