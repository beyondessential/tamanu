import config from 'config';
import { initDatabase } from './app/database';
import { log } from './app/logging';

import { createApp } from './app/createApp';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';

import { importDataDefinition } from './app/dataDefinitionImporter';

const port = config.port;

async function performInitialSetup({ sequelize, models }) {
  // sync models with database
  // (TODO: proper migrations)
  await sequelize.sync();

  const existingUser = await models.User.findOne();
  if (existingUser) {
    // database has been populated
    return;
  }

  // run initial import
  const path = config.initialDataPath;
  log.info(`Importing initial data from ${path}...`);
  await importDataDefinition(models, path, sheetResult => {
    const { sheetName, created, updated, errors } = sheetResult;
    log.info(`Importing ${sheetName}: ${created} created, ${updated} updated.`);
    errors.map(message => {
      log.warn(`- ${message}`);
    });
  });
  log.info(`Data import completed.`);
}

export async function run() {
  const context = initDatabase({
    testMode: false,
  });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  startScheduledTasks(context);

  startDataChangePublisher(server, context);

  // TODO: sync with remote server
}

run();
