import config from 'config';
import { log } from 'shared/services/logging';
import { parseArguments } from 'shared/arguments';
import { initDatabase } from './app/database';
import { addPatientMarkForSyncHook, SyncManager, WebRemote } from './app/sync';

import { createApp } from './app/createApp';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';

import { listenForServerQueries } from './app/discovery';

async function serve(options) {
  const context = await initDatabase();

  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate({ migrateDirection: "up" });
  } else {
    await context.sequelize.assertUpToDate(options);
  }

  context.remote = new WebRemote(context);
  context.remote.connect(); // preemptively connect remote to speed up sync
  context.syncManager = new SyncManager(context);

  const app = createApp(context);

  const port = config.port;
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    app.close();
  });

  listenForServerQueries();

  startScheduledTasks(context);

  addPatientMarkForSyncHook(context);

  startDataChangePublisher(server, context);
}

async function migrate(options) {
  const context = await initDatabase();
  await context.sequelize.migrate(options);
  process.exit(0);
}

async function run(command, options) {
  const subcommand = {
    serve,
    migrate,
  }[command];

  if (!subcommand) {
    throw new Error(`Unrecognised subcommand: ${command}`);
  }

  return subcommand(options);
}

// catch and exit if run() throws an error
(async () => {
  try {
    const { command, ...options } = parseArguments();
    await run(command, options);
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
})();
