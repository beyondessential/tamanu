import config from 'config';

import { log } from 'shared/services/logging';

import { checkConfig } from '../checkConfig';
import { initDatabase, performDatabaseIntegrityChecks } from '../database';
import { addPatientMarkForSyncHook, SyncManager, WebRemote } from '../sync';
import { createApp } from '../createApp';
import { startScheduledTasks } from '../tasks';
import { startDataChangePublisher } from '../DataChangePublisher';
import { listenForServerQueries } from '../discovery';

import { version } from '../../package.json';

export async function serve(options) {
  log.info(`Starting facility server version ${version}.`);

  const context = await initDatabase(options);
  if (config.db.sqlitePath || config.db.migrateOnStartup) {
    await context.sequelize.migrate({ up: true });
  } else {
    await context.sequelize.assertUpToDate(options);
  }

  await checkConfig(config, context);
  await performDatabaseIntegrityChecks(context);

  context.remote = new WebRemote(context);
  context.remote.connect(); // preemptively connect remote to speed up sync
  context.syncManager = new SyncManager(context);

  const app = createApp(context);

  const { port } = config;
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
  });

  listenForServerQueries();

  startScheduledTasks(context);

  addPatientMarkForSyncHook(context);

  startDataChangePublisher(server, context);
}
