import config from 'config';

import { log } from 'shared/services/logging';
import { parseArguments } from 'shared/arguments';
import { checkConfig } from './app/checkConfig';

import { initDatabase, performDatabaseIntegrityChecks } from './app/database';
import { addPatientMarkForSyncHook, SyncManager, WebRemote } from './app/sync';
import { createApp } from './app/createApp';
import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';
import { listenForServerQueries } from './app/discovery';

import { version } from './package.json';

async function serve(options) {
  log.info(`Starting facility server version ${version}.`);

  const context = await initDatabase(options);
  if (config.db.sqlitePath || config.db.migrateOnStartup) {
    await context.sequelize.migrate({ migrateDirection: 'up' });
  } else {
    await context.sequelize.assertUpToDate(options);
  }

  await checkConfig(config, context);
  await performDatabaseIntegrityChecks(context);

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

async function report(options) {
  const context = await initDatabase();
  // going via inline import rather than top-level just to keep diff footprint small during a hotfix
  // should be fine to pull to the top level
  const { getReportModule } = await import('shared/reports');
  const module = getReportModule(options.name);
  log.info(`Running report ${options.name} (with empty parameters)`);
  const result = await module.dataGenerator(context, {});
  console.log(result);
  process.exit(0);
}

async function run(command, options) {
  const subcommand = {
    serve,
    migrate,
    report,
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
